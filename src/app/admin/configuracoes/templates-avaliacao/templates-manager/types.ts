import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'

export interface Template {
  id: string
  nome: string
  descricao: string | null
  criterios: CriterioAvaliacao[] | unknown
  formula: string | null
  isSystem: boolean
  ativo: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export interface Props {
  initialTemplates: Template[]
}
