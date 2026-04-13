import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

export const runtime = 'nodejs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ─── POST — Retirar inscrição para edição (ENVIADA → RASCUNHO) ─────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
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
      include: {
        edital: { select: { id: true, status: true } },
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

    if (inscricao.proponenteId !== session.user.id) {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso negado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.status !== 'ENVIADA') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'Apenas inscrições enviadas podem ser retiradas para edição.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    if (inscricao.edital.status !== 'INSCRICOES_ABERTAS') {
      const res = NextResponse.json(
        { error: 'FORBIDDEN', message: 'O prazo de inscrições para este edital foi encerrado.', requestId },
        { status: 403 },
      )
      res.headers.set('X-Request-Id', requestId)
      res.headers.set('Cache-Control', 'no-store')
      return res
    }

    await prisma.inscricao.update({
      where: { id },
      data: { status: 'RASCUNHO' },
    })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.INSCRICAO_RETIRADA,
      entity: 'Inscricao',
      entityId: id,
      details: { editalId: inscricao.edital.id },
    })

    const res = NextResponse.json(
      { data: { id, status: 'RASCUNHO' }, requestId },
      { status: 200 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')

    console.log({ requestId, method: 'POST', path: `/api/proponente/inscricoes/${id}/retract`, status: 200, durationMs: Date.now() - start })
    return res
  } catch (err) {
    const res = NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro interno.', requestId },
      { status: 500 },
    )
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return res
  }
}
