import { prisma } from '@server/lib/db'
import type { TriggerContext, TriggerResult, RascunhoPendenteConfig } from '../types'

/**
 * Trigger: INSCRICAO_RASCUNHO_PENDENTE
 *
 * Encontra usuários cuja inscrição está em RASCUNHO há mais de N horas
 * (config.horas) sem atualização — e cujo edital ainda está com
 * INSCRICOES_ABERTAS (lembrete só faz sentido se o proponente ainda
 * pode enviar a inscrição). Opcionalmente restrita a editalIds.
 *
 * Dedupe: cada execução só dispara pra usuários que ainda NÃO receberam
 * uma notificação por esta regra nas últimas 24h (evita spam diário).
 */
export async function rascunhoPendenteExecutor(ctx: TriggerContext): Promise<TriggerResult> {
  const config = ctx.ruleConfig as RascunhoPendenteConfig
  const horas = Math.max(1, Number(config.horas) || 24)

  const cutoff = new Date(Date.now() - horas * 60 * 60 * 1000)

  const inscricoes = await prisma.inscricao.findMany({
    where: {
      status: 'RASCUNHO',
      updatedAt: { lt: cutoff },
      edital: {
        status: 'INSCRICOES_ABERTAS',
      },
      ...(config.editalIds && config.editalIds.length > 0
        ? { editalId: { in: config.editalIds } }
        : {}),
    },
    select: { proponenteId: true },
    distinct: ['proponenteId'],
  })

  const userIds = inscricoes.map((i) => i.proponenteId)

  // Dedupe: remove quem já recebeu nas últimas 24h por esta regra
  // (ruleId chega via campaign.ruleId — dedupe é feito no dispatchTrigger)

  return { userIds }
}
