import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { parseItensBonus, invalidBonusItens } from '@/types/bonus-config'

export const runtime = 'nodejs'

const bodySchema = z.object({ bonusItens: z.array(z.string().min(1)).max(10) })

interface RouteContext {
  params: Promise<{ id: string }>
}

function erro(status: number, error: string, message: string, requestId: string) {
  return NextResponse.json(
    { error, message, requestId },
    { status, headers: { 'X-Request-Id': requestId, 'Cache-Control': 'no-store' } },
  )
}

// ── PUT — grava os itens de bonificação que a comissão validou ──────────────
// Restrito a SUPER_ADMIN e ao ADMIN do edital liberado (mesmo portão do painel
// de nota bônus). O bônus é decisão documental da comissão, nunca do avaliador.
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const requestId = randomUUID()

  try {
    const session = await auth()
    const role = session?.user.role
    if (!session || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
      return erro(403, 'FORBIDDEN', 'Acesso negado.', requestId)
    }

    const { id } = await ctx.params
    const { bonusItens } = bodySchema.parse(await req.json())

    const inscricao = await prisma.inscricao.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        bonusItens: true,
        edital: { select: { id: true, itensBonus: true, bonusVisivelParaAdmin: true } },
      },
    })

    if (!inscricao) return erro(404, 'NOT_FOUND', 'Inscrição não encontrada.', requestId)

    if (role === 'ADMIN' && !inscricao.edital.bonusVisivelParaAdmin) {
      return erro(403, 'FORBIDDEN', 'Acesso negado.', requestId)
    }

    const config = parseItensBonus(inscricao.edital.itensBonus)
    if (!config) {
      return erro(400, 'BAD_REQUEST', 'Este edital não tem itens de bonificação configurados.', requestId)
    }

    const invalidos = invalidBonusItens(config, bonusItens)
    if (invalidos.length > 0) {
      return erro(400, 'BAD_REQUEST', `Itens inexistentes neste edital: ${invalidos.join(', ')}.`, requestId)
    }

    const unicos = [...new Set(bonusItens)]
    if (config.maxItens != null && unicos.length > config.maxItens) {
      return erro(
        400,
        'BAD_REQUEST',
        `Este edital admite no máximo ${config.maxItens} ${config.maxItens === 1 ? 'item' : 'itens'} de bonificação.`,
        requestId,
      )
    }

    const anteriores = inscricao.bonusItens
    await prisma.inscricao.update({ where: { id }, data: { bonusItens: unicos } })

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.BONUS_ITENS_ALTERADOS,
      entity: 'Inscricao',
      entityId: id,
      details: { numero: inscricao.numero, anteriores, novos: unicos },
    })

    const res = NextResponse.json({ ok: true, bonusItens: unicos })
    res.headers.set('X-Request-Id', requestId)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return erro(400, 'BAD_REQUEST', 'Dados inválidos.', requestId)
    }
    console.error({ requestId, error: err instanceof Error ? err.message : 'Unknown' })
    return erro(500, 'INTERNAL_ERROR', 'Erro interno.', requestId)
  }
}
