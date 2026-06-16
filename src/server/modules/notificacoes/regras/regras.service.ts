import type { Prisma } from '@prisma/client'
import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { countAudience } from '@server/lib/notifications/audience'
import { isTriggerImplementado } from '@server/lib/notifications/triggers'
import type { AudienceFilter } from '@server/lib/notifications/types'
import type { RuleInput } from '@shared/schemas/notifications.schema'
import { regrasRepository } from './regras.repository'
import {
  RegraNaoEncontradaError,
  TriggerNaoImplementadoAtivacaoError,
  TriggerNaoImplementadoError,
} from '../errors/notificacoes.errors'

export function listRegras(ativo?: 'true' | 'false') {
  const where =
    ativo === 'true' ? { ativo: true } : ativo === 'false' ? { ativo: false } : {}
  return regrasRepository.list(where)
}

export async function getRegra(id: string) {
  const rule = await regrasRepository.findDetail(id)
  if (!rule) throw new RegraNaoEncontradaError()
  return rule
}

export async function createRegra(data: RuleInput, userId: string, ip?: string) {
  if (!isTriggerImplementado(data.trigger)) throw new TriggerNaoImplementadoError(data.trigger)

  const rule = await regrasRepository.create({
    nome: data.nome,
    descricao: data.descricao ?? null,
    trigger: data.trigger,
    ativo: false,
    config: data.config as Prisma.InputJsonValue,
    assunto: data.assunto,
    corpo: data.corpo,
    link: data.link ?? null,
    ctaLabel: data.ctaLabel ?? null,
    canais: data.canais,
    filtro: data.filtro as Prisma.InputJsonValue,
    createdById: userId,
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_REGRA_CRIADA,
    entity: 'NotificationRule',
    entityId: rule.id,
    details: { nome: rule.nome, trigger: rule.trigger },
    ip,
  })

  return rule
}

export async function updateRegra(id: string, data: RuleInput, userId: string, ip?: string) {
  const existing = await regrasRepository.findById(id)
  if (!existing) throw new RegraNaoEncontradaError()
  if (!isTriggerImplementado(data.trigger)) throw new TriggerNaoImplementadoError(data.trigger)

  const rule = await regrasRepository.update(id, {
    nome: data.nome,
    descricao: data.descricao ?? null,
    trigger: data.trigger,
    config: data.config as Prisma.InputJsonValue,
    assunto: data.assunto,
    corpo: data.corpo,
    link: data.link ?? null,
    ctaLabel: data.ctaLabel ?? null,
    canais: data.canais,
    filtro: data.filtro as Prisma.InputJsonValue,
  })

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_REGRA_ATUALIZADA,
    entity: 'NotificationRule',
    entityId: rule.id,
    details: { nome: rule.nome, trigger: rule.trigger },
    ip,
  })

  return rule
}

export async function deleteRegra(id: string, userId: string, ip?: string) {
  const existing = await regrasRepository.findById(id)
  if (!existing) throw new RegraNaoEncontradaError()

  await regrasRepository.delete(id)

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.NOTIFICACAO_REGRA_EXCLUIDA,
    entity: 'NotificationRule',
    entityId: id,
    details: { nome: existing.nome, trigger: existing.trigger },
    ip,
  })
}

export async function toggleRegra(id: string, ativo: boolean, userId: string, ip?: string) {
  const existing = await regrasRepository.findById(id)
  if (!existing) throw new RegraNaoEncontradaError()

  if (ativo && !isTriggerImplementado(existing.trigger)) {
    throw new TriggerNaoImplementadoAtivacaoError(existing.trigger)
  }

  const rule = await regrasRepository.update(id, { ativo })

  await logAudit({
    userId,
    action: ativo
      ? AUDIT_ACTIONS.NOTIFICACAO_REGRA_ATIVADA
      : AUDIT_ACTIONS.NOTIFICACAO_REGRA_DESATIVADA,
    entity: 'NotificationRule',
    entityId: rule.id,
    details: { nome: rule.nome, trigger: rule.trigger },
    ip,
  })

  return rule
}

export async function previewRegraAudience(id: string) {
  const rule = await regrasRepository.findFiltro(id)
  if (!rule) throw new RegraNaoEncontradaError()
  return countAudience((rule.filtro ?? {}) as AudienceFilter)
}
