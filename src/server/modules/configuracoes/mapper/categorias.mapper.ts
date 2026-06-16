import type { Category } from '@prisma/client'
import type { CategoriaDTO } from '@shared/dtos/configuracoes.dto'

export function toCategoriaDTO(categoria: Category): CategoriaDTO {
  return {
    id: categoria.id,
    nome: categoria.nome,
    slug: categoria.slug,
    descricao: categoria.descricao,
    ativa: categoria.ativa,
    isSystem: categoria.isSystem,
    ordem: categoria.ordem,
    createdAt: categoria.createdAt.toISOString(),
    updatedAt: categoria.updatedAt.toISOString(),
  }
}
