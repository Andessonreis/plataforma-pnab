import { logAudit } from '@server/lib/audit'
import { generateSimpleSlug } from '@shared/utils/slug'
import type {
  CategoriaCreateInput,
  CategoriaReorderInput,
  CategoriaUpdateInput,
} from '@shared/schemas/configuracoes-categorias.schema'
import { categoriasRepository } from '../repository/categorias.repository'
import {
  CategoriaNaoEncontradaError,
  CategoriaNomeDuplicadoError,
  CategoriaSistemaError,
} from '../errors/configuracoes.errors'

export function listCategorias(includeInactive: boolean) {
  return categoriasRepository.list(includeInactive)
}

async function resolveUniqueSlug(nome: string): Promise<string> {
  let slug = generateSimpleSlug(nome)
  const existing = await categoriasRepository.findBySlug(slug)
  if (existing) {
    const similares = await categoriasRepository.findSlugsStartingWith(slug)
    const usados = new Set(similares.map((s) => s.slug))
    let suffix = 2
    while (usados.has(`${slug}-${suffix}`)) suffix++
    slug = `${slug}-${suffix}`
  }
  return slug
}

export async function createCategoria(data: CategoriaCreateInput, userId: string, ip?: string) {
  const slug = await resolveUniqueSlug(data.nome)

  const nomeTrim = data.nome.trim()
  const existingNome = await categoriasRepository.findByNome(nomeTrim)
  if (existingNome) throw new CategoriaNomeDuplicadoError()

  const last = await categoriasRepository.findLast()
  const nextOrdem = (last?.ordem ?? 0) + 10

  const categoria = await categoriasRepository.create({
    nome: nomeTrim,
    slug,
    descricao: data.descricao?.trim() || null,
    ativa: true,
    isSystem: false,
    ordem: nextOrdem,
  })

  await logAudit({
    userId,
    action: 'CATEGORIA_CRIADA',
    entity: 'Category',
    entityId: categoria.id,
    details: { nome: categoria.nome, slug: categoria.slug },
    ip,
  })

  return categoria
}

export async function updateCategoria(
  id: string,
  data: CategoriaUpdateInput,
  userId: string,
  ip?: string,
) {
  const existing = await categoriasRepository.findById(id)
  if (!existing) throw new CategoriaNaoEncontradaError()

  const updateData: Record<string, unknown> = {}

  if (existing.isSystem) {
    if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
    if (data.ativa !== undefined) updateData.ativa = data.ativa
  } else {
    if (data.nome !== undefined) {
      const trimmedNome = data.nome.trim()
      const dup = await categoriasRepository.findByNome(trimmedNome, id)
      if (dup) throw new CategoriaNomeDuplicadoError()
      updateData.nome = trimmedNome
    }
    if (data.descricao !== undefined) updateData.descricao = data.descricao?.trim() || null
    if (data.ativa !== undefined) updateData.ativa = data.ativa
  }

  const categoria = await categoriasRepository.update(id, updateData)

  await logAudit({
    userId,
    action: 'CATEGORIA_ATUALIZADA',
    entity: 'Category',
    entityId: categoria.id,
    details: { nome: categoria.nome, changes: Object.keys(updateData) },
    ip,
  })

  return categoria
}

export async function deleteCategoria(id: string, userId: string, ip?: string) {
  const existing = await categoriasRepository.findById(id)
  if (!existing) throw new CategoriaNaoEncontradaError()
  if (existing.isSystem) throw new CategoriaSistemaError()

  await categoriasRepository.delete(id)

  await logAudit({
    userId,
    action: 'CATEGORIA_EXCLUIDA',
    entity: 'Category',
    entityId: id,
    details: { nome: existing.nome, slug: existing.slug },
    ip,
  })
}

export async function reorderCategorias(data: CategoriaReorderInput, userId: string, ip?: string) {
  await categoriasRepository.reorder(data.items)

  await logAudit({
    userId,
    action: 'CATEGORIAS_REORDENADAS',
    entity: 'Category',
    details: { count: data.items.length },
    ip,
  })
}
