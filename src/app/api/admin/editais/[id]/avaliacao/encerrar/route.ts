import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'

export const runtime = 'nodejs'

const bodySchema = z.object({ encerrar: z.boolean() })

interface RouteContext {
  params: Promise<{ id: string }>
}

function erro(status: number, error: string, message: string, requestId: string) {
  return NextResponse.json(
    { error, message, requestId },
    { status, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
  )
}

// ── POST — encerra ou reabre o lançamento de nota pelos pareceristas ─────────
// Fecha só para o avaliador: a equipe interna continua editando, porque a
// conferência de bonificação e a consolidação acontecem depois desse prazo.
export async function POST(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    const role = session?.user.role
    if (!session || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return erro(403, 'FORBIDDEN', 'Acesso negado.', requestId)
    }

    const { id: editalId } = await ctx.params
    const { encerrar } = bodySchema.parse(await req.json())

    const atual = await prisma.edital.findUnique({
      where: { id: editalId },
      select: { id: true, titulo: true, status: true, avaliacaoEncerradaEm: true },
    })
    if (!atual) return erro(404, 'NOT_FOUND', 'Edital não encontrado.', requestId)

    const jaEncerrada = atual.avaliacaoEncerradaEm != null
    if (jaEncerrada === encerrar) {
      return NextResponse.json(
        { ok: true, avaliacaoEncerradaEm: atual.avaliacaoEncerradaEm },
        { headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
      )
    }

    const edital = await prisma.edital.update({
      where: { id: editalId },
      data: { avaliacaoEncerradaEm: encerrar ? new Date() : null },
      select: { avaliacaoEncerradaEm: true },
    })

    // Contexto de auditoria: quantas avaliações ficaram em aberto no momento
    // do fechamento — é o que explica uma nota faltando lá na frente.
    const pendentes = await prisma.avaliacao.count({
      where: { inscricao: { editalId }, finalizada: false },
    })

    await logAudit({
      userId: session.user.id,
      action: encerrar ? AUDIT_ACTIONS.AVALIACAO_FASE_ENCERRADA : AUDIT_ACTIONS.AVALIACAO_FASE_REABERTA,
      entity: 'Edital',
      entityId: editalId,
      details: {
        editalTitulo: atual.titulo,
        editalStatus: atual.status,
        avaliacoesNaoFinalizadas: pendentes,
      },
    })

    return NextResponse.json(
      { ok: true, avaliacaoEncerradaEm: edital.avaliacaoEncerradaEm, avaliacoesNaoFinalizadas: pendentes },
      { headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      return erro(400, 'BAD_REQUEST', 'Dados inválidos.', requestId)
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return erro(500, 'INTERNAL_ERROR', 'Erro interno.', requestId)
  }
}
