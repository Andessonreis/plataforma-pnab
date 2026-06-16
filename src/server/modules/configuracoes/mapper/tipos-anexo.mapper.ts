import type { AttachmentType } from '@prisma/client'
import type { TipoAnexoDTO } from '@shared/dtos/configuracoes.dto'

export function toTipoAnexoDTO(tipo: AttachmentType): TipoAnexoDTO {
  return {
    id: tipo.id,
    tipo: tipo.tipo,
    label: tipo.label,
    obrigatorio: tipo.obrigatorio,
    tag: tipo.tag,
    isSystem: tipo.isSystem,
    createdAt: tipo.createdAt.toISOString(),
    updatedAt: tipo.updatedAt.toISOString(),
  }
}
