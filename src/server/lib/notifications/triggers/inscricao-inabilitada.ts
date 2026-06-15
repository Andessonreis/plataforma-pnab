import { prisma } from '@server/lib/db'
import type { TriggerContext, TriggerResult, InscricaoInabilitadaConfig } from '../types'

/**
 * Trigger: INSCRICAO_INABILITADA
 *
 * Disparado sob demanda quando uma inscrição é marcada como INABILITADA.
 * Audiência: o proponente da inscrição.
 */
export async function inscricaoInabilitadaExecutor(ctx: TriggerContext): Promise<TriggerResult> {
  const config = ctx.ruleConfig as InscricaoInabilitadaConfig
  const inscricaoId = config.inscricaoId ?? (ctx.event?.inscricaoId as string | undefined)

  if (!inscricaoId) {
    return { userIds: [] }
  }

  const inscricao = await prisma.inscricao.findUnique({
    where: { id: inscricaoId },
    select: { proponenteId: true, status: true },
  })

  if (!inscricao || inscricao.status !== 'INABILITADA') {
    return { userIds: [] }
  }

  return { userIds: [inscricao.proponenteId] }
}
