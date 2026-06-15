import type { InscricaoAnexoDTO } from '@shared/dtos/inscricoes.dto'

type AnexoRow = {
  id: string
  tipo: string
  titulo: string
  url: string
  valido: boolean | null
  observacao: string | null
  createdAt: Date
}

export function toAnexoInscricao(a: AnexoRow): InscricaoAnexoDTO {
  return {
    id: a.id,
    tipo: a.tipo,
    titulo: a.titulo,
    url: a.url,
    valido: a.valido,
    observacao: a.observacao,
    createdAt: a.createdAt.toISOString(),
  }
}
