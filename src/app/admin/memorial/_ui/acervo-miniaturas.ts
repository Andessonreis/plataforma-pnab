import type { StatusConteudo } from '@prisma/client'
import { imagemDoItem } from '@/lib/memorial/midia'
import { listarAdmin } from '@/lib/services/memorial-acervo.service'

/** Mesmo teto dos seletores de vínculo (opcoesDeVinculo). */
const LIMITE = 300

export interface Miniatura {
  id: string
  titulo: string
  imagem: string | null
  status: StatusConteudo
  albumId: string | null
}

/**
 * Itens do acervo com a imagem, para escolher foto pela foto (exposições) e montar
 * a capa dos álbuns. Os mais recentes primeiro, até o mesmo limite dos seletores.
 */
export async function miniaturasDoAcervo(): Promise<Miniatura[]> {
  const { itens } = await listarAdmin({ page: 1, pageSize: LIMITE })
  return itens.map((i) => ({ id: i.id, titulo: i.titulo, imagem: imagemDoItem(i), status: i.status, albumId: i.albumId }))
}
