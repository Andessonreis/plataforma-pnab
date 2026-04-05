// Categorias culturais — interface compartilhada entre admin e formulários

export interface Category {
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
