import type { CriterioAvaliacao } from '@shared/avaliacao-criterios'

export type CategoriaDTO = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ativa: boolean
  isSystem: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export type TemplateAvaliacaoDTO = {
  id: string
  nome: string
  descricao: string | null
  criterios: CriterioAvaliacao[]
  formula: string | null
  isSystem: boolean
  ativo: boolean
  ordem: number
  createdAt: string
  updatedAt: string
}

export type TipoAnexoDTO = {
  id: string
  tipo: string
  label: string
  obrigatorio: boolean
  tag: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export type TiposAnexoListDTO = {
  tipos: TipoAnexoDTO[]
  tags: string[]
}
