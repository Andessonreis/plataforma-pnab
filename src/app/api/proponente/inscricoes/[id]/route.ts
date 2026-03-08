import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

const updateSchema = z.object({
  campos: z.record(z.unknown()).optional(),
  categoria: z.string().optional(),
  orcamento: z.record(z.unknown()).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── GET — Detalhes da inscrição ────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session) {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Não autenticado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      include: {
        edital: {
          select: {
            id: true,
            titulo: true,
            slug: true,
            categorias: true,
            camposFormulario: true,
            status: true,
          },
        },
        anexos: {
          orderBy: { createdAt: 'asc' },
        },
        proponente: {
          select: { id: true, nome: true },
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

    // Verificar acesso: apenas o proponente dono ou ADMIN
    const isOwner = inscricao.proponenteId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'
    if (!isOwner && !isAdmin) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const res = NextResponse.json({ data: inscricao, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'GET', path: `/api/proponente/inscricoes/${id}`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}

// ─── PUT — Atualizar rascunho ───────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const requestId = randomUUID()
  const start = Date.now()
  const { id } = await params

  try {
    const session = await auth()
    if (!session || session.user.role !== 'PROPONENTE') {
      const res = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Acesso negado.', requestId },
        { status: 401 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: { id: true, proponenteId: true, status: true, editalId: true },
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

    if (inscricao.proponenteId !== session.user.id) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.status !== 'RASCUNHO') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas rascunhos podem ser editados.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // Validar categoria se fornecida
    if (data.categoria !== undefined) {
      const edital = await prisma.edital.findUnique({
        where: { id: inscricao.editalId },
        select: { categorias: true },
      })
      if (edital && edital.categorias.length > 0 && data.categoria && !edital.categorias.includes(data.categoria)) {
        const res = NextResponse.json(
          { error: 'BAD_REQUEST', message: 'Categoria inválida para este edital.', requestId },
          { status: 400 },
        )
        res.headers.set('X-Request-Id', requestId)
        res.headers.set('Cache-Control', 'no-store')
        return res
      }
    }

    const updateData: Record<string, unknown> = {}
    if (data.campos !== undefined) updateData.campos = data.campos
    if (data.categoria !== undefined) updateData.categoria = data.categoria || null
    if (data.orcamento !== undefined) updateData.orcamento = data.orcamento

    const updated = await prisma.inscricao.update({
      where: { id },
      data: updateData,
      include: {
        edital: {
          select: { id: true, titulo: true, categorias: true, camposFormulario: true },
        },
        anexos: { orderBy: { createdAt: 'asc' } },
      },
    })

    const res = NextResponse.json({ data: updated, requestId })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'PUT', path: `/api/proponente/inscricoes/${id}`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      for (const e of err.errors) {
        fieldErrors[e.path.join('.')] = e.message
      }
      const res = NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', fieldErrors, requestId },
        { status: 400 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
}
