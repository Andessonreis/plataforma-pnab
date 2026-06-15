import { prisma } from '@server/lib/db'
import { enqueueCampaignDispatch } from '@server/lib/queue'
import { getTriggerDefinition } from './triggers'
import type { AudienceFilter, TriggerConfig } from './types'
import type { NotificationRule, NotificationRuleTrigger } from '@prisma/client'

/**
 * Dispara uma regra automática:
 * - Executa o trigger correspondente pra resolver userIds elegíveis
 * - Dedupe: remove userIds que já receberam notificação por esta regra nas últimas 24h
 * - Cria uma NotificationCampaign(tipo=REGRA) com filtro snapshot
 * - Enfileira o job de dispatch
 *
 * Retorna o campaignId criado, ou null se não houve audiência.
 */
export async function dispatchRule(
  rule: NotificationRule,
  event?: Record<string, unknown>,
): Promise<string | null> {
  const def = getTriggerDefinition(rule.trigger)
  if (!def.implementado || !def.executor) {
    console.warn(`[dispatchRule] Trigger ${rule.trigger} não implementado — skip`)
    return null
  }

  if (!rule.ativo) {
    console.log(`[dispatchRule] Regra ${rule.id} (${rule.nome}) inativa — skip`)
    return null
  }

  const result = await def.executor({
    ruleConfig: rule.config as TriggerConfig,
    event,
  })

  if (result.userIds.length === 0) {
    return null
  }

  // Dedupe: remove quem já recebeu por esta regra nas últimas 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentes = await prisma.notification.findMany({
    where: {
      userId: { in: result.userIds },
      campaign: { ruleId: rule.id },
      createdAt: { gte: yesterday },
    },
    select: { userId: true },
    distinct: ['userId'],
  })
  const jaRecebido = new Set(recentes.map((n) => n.userId))
  const userIds = result.userIds.filter((id) => !jaRecebido.has(id))

  if (userIds.length === 0) {
    console.log(`[dispatchRule] Regra ${rule.id}: todos os ${result.userIds.length} alvos já receberam nas últimas 24h`)
    return null
  }

  // Snapshot do filtro: combina filtro da regra + override do trigger + lista final de userIds
  const filtroBase = (rule.filtro ?? {}) as AudienceFilter
  const filtroSnapshot: AudienceFilter = {
    ...filtroBase,
    ...result.filtroOverride,
    userIds, // lista final já deduplicada — audience.resolve consome direto
  }

  const campaign = await prisma.notificationCampaign.create({
    data: {
      tipo: 'REGRA',
      status: 'RASCUNHO',
      titulo: `[auto] ${rule.nome}`,
      assunto: rule.assunto,
      corpo: rule.corpo,
      link: rule.link,
      ctaLabel: rule.ctaLabel,
      canais: rule.canais,
      filtro: filtroSnapshot as object,
      ruleId: rule.id,
      createdById: rule.createdById,
    },
  })

  await enqueueCampaignDispatch({ campaignId: campaign.id })

  console.log(
    `[dispatchRule] Regra ${rule.id} (${rule.nome}) → campanha ${campaign.id} criada (${userIds.length} alvos)`,
  )

  return campaign.id
}

/**
 * Dispara um trigger sob demanda (ex: ao publicar edital).
 * Busca todas as regras ATIVAS com o trigger correspondente e dispara cada uma.
 */
export async function dispatchTrigger(
  trigger: NotificationRuleTrigger,
  event: Record<string, unknown>,
): Promise<string[]> {
  const rules = await prisma.notificationRule.findMany({
    where: { trigger, ativo: true },
  })

  const campaignIds: string[] = []
  for (const rule of rules) {
    const id = await dispatchRule(rule, event)
    if (id) campaignIds.push(id)
  }
  return campaignIds
}

/**
 * Avalia todas as regras periódicas ativas (chamado pelo scheduler).
 */
export async function evaluatePeriodicRules(): Promise<number> {
  const rules = await prisma.notificationRule.findMany({
    where: { ativo: true },
  })

  let disparadas = 0
  for (const rule of rules) {
    const def = getTriggerDefinition(rule.trigger)
    if (!def.periodico || !def.implementado) continue

    const id = await dispatchRule(rule)
    if (id) disparadas++
  }
  return disparadas
}
