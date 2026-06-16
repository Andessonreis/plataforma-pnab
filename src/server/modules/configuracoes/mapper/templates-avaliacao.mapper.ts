import type { EvaluationTemplate } from '@prisma/client'
import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'
import type { TemplateAvaliacaoDTO } from '@shared/dtos/configuracoes.dto'

export function toTemplateAvaliacaoDTO(template: EvaluationTemplate): TemplateAvaliacaoDTO {
  return {
    id: template.id,
    nome: template.nome,
    descricao: template.descricao,
    criterios: (Array.isArray(template.criterios) ? template.criterios : []) as CriterioAvaliacao[],
    formula: template.formula,
    isSystem: template.isSystem,
    ativo: template.ativo,
    ordem: template.ordem,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  }
}
