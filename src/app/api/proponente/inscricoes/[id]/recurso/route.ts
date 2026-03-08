import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

export const runtime = 'nodejs'

const recursoSchema = z.object({
  fase: z.enum(['HABILITACAO', 'RESULTADO_PRELIMINAR', 'RESULTADO_FINAL']),
  texto: z.string().min(20, 'O texto do recurso deve ter no mínimo 20 caracteres').max(5000, 'O texto do recurso deve ter no máximo 5000 caracteres'),
  urlAnexos: z.array(z.string().url()).max(5).default([]),
})

// Mapeamento: status da inscrição → fases que permitem recurso
const STATUS_ALLOWS_RECURSO: Record<string, string[]> = {
  INABILITADA: ['HABILITACAO'],
  RESULTADO_PRELIMINAR: ['RESULTADO_PRELIMINAR'],
  NAO_CONTEMPLADA: ['RESULTADO_FINAL'],
  SUPLENTE: ['RESULTADO_FINAL'],
}

// GET — Listar recursos da inscrição
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado.', requestId },
        { status: 401 },
      )
    }

    const { id } = await params

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: { proponenteId: true },
    })

    if (!inscricao) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
    }

    // Apenas o dono ou admin/habilitador
    const isOwner = inscricao.proponenteId === session.user.id
    const isStaff = ['ADMIN', 'HABILITADOR'].includes(session.user.role)
    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
    }

    const recursos = await prisma.recurso.findMany({
      where: { inscricaoId: id },
      orderBy: { createdAt: 'desc' },
    })

    const res = NextResponse.json({ data: recursos, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao listar recursos.', requestId },
      { status: 500 },
    )
  }
}

// POST — Submeter recurso
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado.', requestId },
        { status: 401 },
      )
    }

    const { id } = await params
    const body = await req.json()
    const data = recursoSchema.parse(body)

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: { proponenteId: true, status: true, editalId: true },
    })

    if (!inscricao) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
    }

    // Apenas o dono pode submeter recurso
    if (inscricao.proponenteId !== session.user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas o proponente pode interpor recurso.', requestId },
        { status: 403 },
      )
    }

    // Verifica se o status atual permite recurso na fase solicitada
    const allowedFases = STATUS_ALLOWS_RECURSO[inscricao.status] ?? []
    if (!allowedFases.includes(data.fase)) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Não é possível interpor recurso nesta fase.', requestId },
        { status: 400 },
      )
    }

    // Verifica se já existe recurso para esta fase
    const existing = await prisma.recurso.findFirst({
      where: { inscricaoId: id, fase: data.fase },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'Já existe um recurso para esta fase.', requestId },
        { status: 409 },
      )
    }

    // Cria o recurso
    const recurso = await prisma.recurso.create({
      data: {
        inscricaoId: id,
        fase: data.fase,
        texto: data.texto,
        urlAnexos: data.urlAnexos,
      },
    })

    // Atualiza status da inscrição
    await prisma.inscricao.update({
      where: { id },
      data: { status: 'RECURSO_ABERTO' },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.RECURSO_SUBMETIDO,
      entity: 'Recurso',
      entityId: recurso.id,
      details: { inscricaoId: id, fase: data.fase },
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })

    const res = NextResponse.json(
      { message: 'Recurso submetido com sucesso.', id: recurso.id, requestId },
      { status: 201 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.log({ requestId, method: 'POST', path: `/api/proponente/inscricoes/${id}/recurso`, status: 201, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: err.errors[0].message, requestId },
        { status: 400 },
      )
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao submeter recurso.', requestId },
      { status: 500 },
    )
  }
}
