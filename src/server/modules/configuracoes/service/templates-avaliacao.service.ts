import { logAudit } from '@server/lib/audit'
import type {
  TemplateAvaliacaoCreateInput,
  TemplateAvaliacaoUpdateInput,
} from '@shared/schemas/configuracoes-templates-avaliacao.schema'
import { templatesAvaliacaoRepository } from '../repository/templates-avaliacao.repository'
import {
  TemplateAvaliacaoNaoEncontradoError,
  TemplateAvaliacaoNomeDuplicadoError,
  TemplateAvaliacaoSistemaError,
} from '../errors/configuracoes.errors'

export function listTemplatesAvaliacao(includeInactive: boolean) {
  return templatesAvaliacaoRepository.list(includeInactive)
}

export async function getTemplateAvaliacao(id: string) {
  const template = await templatesAvaliacaoRepository.findById(id)
  if (!template) throw new TemplateAvaliacaoNaoEncontradoError()
  return template
}

export async function createTemplateAvaliacao(
  data: TemplateAvaliacaoCreateInput,
  userId: string,
  ip?: string,
) {
  const nomeTrim = data.nome.trim()
  const existingNome = await templatesAvaliacaoRepository.findByNome(nomeTrim)
  if (existingNome) throw new TemplateAvaliacaoNomeDuplicadoError()

  const last = await templatesAvaliacaoRepository.findLast()
  const nextOrdem = (last?.ordem ?? 0) + 10

  const template = await templatesAvaliacaoRepository.create({
    nome: nomeTrim,
    descricao: data.descricao?.trim() || null,
    criterios: data.criterios,
    formula: data.formula?.trim() || null,
    isSystem: false,
    ativo: true,
    ordem: nextOrdem,
  })

  await logAudit({
    userId,
    action: 'TEMPLATE_AVALIACAO_CRIADO',
    entity: 'EvaluationTemplate',
    entityId: template.id,
    details: { nome: template.nome, criteriosCount: data.criterios.length },
    ip,
  })

  return template
}

export async function updateTemplateAvaliacao(
  id: string,
  data: TemplateAvaliacaoUpdateInput,
  userId: string,
  ip?: string,
) {
  const existing = await templatesAvaliacaoRepository.findById(id)
  if (!existing) throw new TemplateAvaliacaoNaoEncontradoError()

  const updateData: Record<string, unknown> = {}

  if (existing.isSystem) {
    if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
    if (data.criterios !== undefined) updateData.criterios = data.criterios
    if (data.formula !== undefined) updateData.formula = data.formula?.trim() || null
    if (data.ativo !== undefined) updateData.ativo = data.ativo
  } else {
    if (data.nome !== undefined) {
      const trimmedNome = data.nome.trim()
      const dup = await templatesAvaliacaoRepository.findByNome(trimmedNome, id)
      if (dup) throw new TemplateAvaliacaoNomeDuplicadoError()
      updateData.nome = trimmedNome
    }
    if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
    if (data.criterios !== undefined) updateData.criterios = data.criterios
    if (data.formula !== undefined) updateData.formula = data.formula?.trim() || null
    if (data.ativo !== undefined) updateData.ativo = data.ativo
  }

  const template = await templatesAvaliacaoRepository.update(id, updateData)

  await logAudit({
    userId,
    action: 'TEMPLATE_AVALIACAO_ATUALIZADO',
    entity: 'EvaluationTemplate',
    entityId: template.id,
    details: { nome: template.nome, changes: Object.keys(updateData) },
    ip,
  })

  return template
}

export async function deleteTemplateAvaliacao(id: string, userId: string, ip?: string) {
  const existing = await templatesAvaliacaoRepository.findById(id)
  if (!existing) throw new TemplateAvaliacaoNaoEncontradoError()
  if (existing.isSystem) throw new TemplateAvaliacaoSistemaError()

  await templatesAvaliacaoRepository.delete(id)

  await logAudit({
    userId,
    action: 'TEMPLATE_AVALIACAO_EXCLUIDO',
    entity: 'EvaluationTemplate',
    entityId: id,
    details: { nome: existing.nome },
    ip,
  })
}
