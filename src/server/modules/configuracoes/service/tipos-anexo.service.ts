import { logAudit } from '@server/lib/audit'
import { generateTipoSlug } from '@shared/utils/slug'
import type {
  TipoAnexoCreateInput,
  TipoAnexoUpdateInput,
} from '@shared/schemas/configuracoes-tipos-anexo.schema'
import { tiposAnexoRepository } from '../repository/tipos-anexo.repository'
import {
  TipoAnexoNaoEncontradoError,
  TipoAnexoSistemaError,
} from '../errors/configuracoes.errors'

export async function listTiposAnexo(tag?: string) {
  const [tipos, tagsRaw] = await Promise.all([
    tiposAnexoRepository.list(tag),
    tiposAnexoRepository.distinctTags(),
  ])
  return { tipos, tags: tagsRaw.map((t) => t.tag) }
}

export async function getTipoAnexo(id: string) {
  const tipo = await tiposAnexoRepository.findById(id)
  if (!tipo) throw new TipoAnexoNaoEncontradoError()
  return tipo
}

export async function createTipoAnexo(data: TipoAnexoCreateInput, userId: string, ip?: string) {
  let tipoSlug = generateTipoSlug(data.label)
  const existing = await tiposAnexoRepository.findByTipo(tipoSlug)
  if (existing) {
    const similares = await tiposAnexoRepository.findTiposStartingWith(tipoSlug)
    const usados = new Set(similares.map((s) => s.tipo))
    let suffix = 2
    while (usados.has(`${tipoSlug}_${suffix}`)) suffix++
    tipoSlug = `${tipoSlug}_${suffix}`
  }

  const tipo = await tiposAnexoRepository.create({
    tipo: tipoSlug,
    label: data.label,
    obrigatorio: data.obrigatorio,
    tag: data.tag,
    isSystem: false,
  })

  await logAudit({
    userId,
    action: 'TIPO_ANEXO_CRIADO',
    entity: 'AttachmentType',
    entityId: tipo.id,
    details: { tipo: tipo.tipo, label: tipo.label, tag: tipo.tag },
    ip,
  })

  return tipo
}

export async function updateTipoAnexo(
  id: string,
  data: TipoAnexoUpdateInput,
  userId: string,
  ip?: string,
) {
  const existing = await tiposAnexoRepository.findById(id)
  if (!existing) throw new TipoAnexoNaoEncontradoError()

  const tipo = await tiposAnexoRepository.update(
    id,
    existing.isSystem
      ? { label: data.label, obrigatorio: data.obrigatorio }
      : { label: data.label, obrigatorio: data.obrigatorio, tag: data.tag },
  )

  await logAudit({
    userId,
    action: 'TIPO_ANEXO_ATUALIZADO',
    entity: 'AttachmentType',
    entityId: tipo.id,
    details: { tipo: tipo.tipo, label: tipo.label, tag: tipo.tag },
    ip,
  })

  return tipo
}

export async function deleteTipoAnexo(id: string, userId: string, ip?: string) {
  const existing = await tiposAnexoRepository.findById(id)
  if (!existing) throw new TipoAnexoNaoEncontradoError()
  if (existing.isSystem) throw new TipoAnexoSistemaError()

  await tiposAnexoRepository.delete(id)

  await logAudit({
    userId,
    action: 'TIPO_ANEXO_EXCLUIDO',
    entity: 'AttachmentType',
    entityId: id,
    details: { tipo: existing.tipo, label: existing.label, tag: existing.tag },
    ip,
  })
}
