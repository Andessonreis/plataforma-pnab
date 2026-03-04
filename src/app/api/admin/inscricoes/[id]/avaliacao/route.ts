import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { CRITERIOS_AVALIACAO_PADRAO } from '@/lib/avaliacao-criterios'
import type { UserRole } from '@prisma/client'

export const runtime = 'nodejs'

const notaItemSchema = z.object({
  criterio: z.string().min(1),
  nota: z.number().min(0).max(10),
  peso: z.number().min(0).max(100),
})

const avaliacaoBodySchema = z.object({
  notas: z.array(notaItemSchema).min(1),
  parecer: z.string().optional(),
  finalizar: z.boolean().default(false),
})

const ROLES_PERMITIDOS: UserRole[] = ['ADMIN', 'AVALIADOR']

// ─── GET — carrega avaliação existente + critérios do edital ─────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !ROLES_PERMITIDOS.includes(session.user.role as UserRole)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      include: {
        edital: { select: { id: true } },
        avaliacoes: {
          where: { avaliadorId: session.user.id },
          select: {
            id: true,
            notas: true,
            parecer: true,
            notaTotal: true,
            finalizada: true,
            updatedAt: true,
          },
        },
      },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Avaliador só pode ver inscrições atribuídas a ele
    const avaliacao = inscricao.avaliacoes[0] ?? null
    const isAssigned = session.user.role === 'ADMIN' || avaliacao !== null

    if (!isAssigned) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Esta inscrição não foi atribuída a você.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const criterios = [...CRITERIOS_AVALIACAO_PADRAO]

    const res = NextResponse.json({
      avaliacao,
      criterios,
      inscricaoStatus: inscricao.status,
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: `/api/admin/inscricoes/${id}/avaliacao`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    const res = NextResponse.json(
      { error: 'INTERNAL', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}

// ─── PUT — salvar rascunho ou finalizar ──────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID()
  const start = Date.now()

  try {
    const session = await auth()
    if (!session || !ROLES_PERMITIDOS.includes(session.user.role as UserRole)) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const { id } = await params
    const body = await req.json()
    const data = avaliacaoBodySchema.parse(body)

    // Verificar se a inscrição existe e está no status correto
    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: { id: true, numero: true, status: true },
    })

    if (!inscricao) {
      const res = NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inscrição não encontrada.', requestId },
        { status: 404 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Verificar se já existe avaliação finalizada
    const existingAvaliacao = await prisma.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId: id, avaliadorId: session.user.id } },
      select: { id: true, finalizada: true },
    })

    if (existingAvaliacao?.finalizada && session.user.role !== 'ADMIN') {
      const res = NextResponse.json(
        { error: 'LOCKED', message: 'Esta avaliação já foi finalizada e não pode ser alterada.', requestId },
        { status: 422 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    // Calcular nota total ponderada
    const totalPeso = data.notas.reduce((acc, n) => acc + n.peso, 0)
    const notaTotal = totalPeso > 0
      ? data.notas.reduce((acc, n) => acc + (n.nota * n.peso) / totalPeso, 0)
      : 0

    const avaliacaoData = {
      notas: data.notas,
      parecer: data.parecer ?? null,
      notaTotal: parseFloat(notaTotal.toFixed(2)),
      finalizada: data.finalizar,
    }

    const avaliacao = await prisma.avaliacao.upsert({
      where: { inscricaoId_avaliadorId: { inscricaoId: id, avaliadorId: session.user.id } },
      update: avaliacaoData,
      create: {
        inscricaoId: id,
        avaliadorId: session.user.id,
        ...avaliacaoData,
      },
      select: { id: true, notaTotal: true, finalizada: true, updatedAt: true },
    })

    await logAudit({
      userId: session.user.id,
      action: data.finalizar ? 'AVALIACAO_FINALIZADA' : 'AVALIACAO_RASCUNHO_SALVO',
      entity: 'Avaliacao',
      entityId: avaliacao.id,
      details: {
        inscricaoId: id,
        inscricaoNumero: inscricao.numero,
        notaTotal: String(avaliacao.notaTotal),
        finalizada: avaliacao.finalizada,
      },
    })

    const res = NextResponse.json({
      avaliacao,
      message: data.finalizar ? 'Avaliação finalizada com sucesso.' : 'Rascunho salvo.',
    })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'PUT', path: `/api/admin/inscricoes/${id}/avaliacao`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const res = NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Dados inválidos.', issues: err.issues, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json(
      { error: 'INTERNAL', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}
