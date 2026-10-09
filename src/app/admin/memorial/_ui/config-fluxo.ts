import type { StatusConteudo } from '@prisma/client'
import { TRANSICOES } from '@/lib/memorial/publicacao'

/** Caminho normal de um conteúdo até o site; Arquivado fica fora da trilha. */
export const PASSOS_PUBLICACAO = ['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO'] as const satisfies readonly StatusConteudo[]

export interface Passo {
  para: StatusConteudo
  rotulo: string
}

const AVANCO: Partial<Record<StatusConteudo, Passo>> = {
  RASCUNHO: { para: 'EM_REVISAO', rotulo: 'Enviar para revisão' },
  EM_REVISAO: { para: 'APROVADO', rotulo: 'Aprovar' },
  APROVADO: { para: 'PUBLICADO', rotulo: 'Publicar no site' },
  ARQUIVADO: { para: 'RASCUNHO', rotulo: 'Reabrir como rascunho' },
}

const RECUO: Partial<Record<StatusConteudo, Record<string, string>>> = {
  RASCUNHO: { ARQUIVADO: 'Arquivar' },
  EM_REVISAO: { RASCUNHO: 'Voltar para rascunho' },
  APROVADO: { EM_REVISAO: 'Devolver para revisão' },
  PUBLICADO: { APROVADO: 'Tirar do site', ARQUIVADO: 'Arquivar' },
}

/** O único passo em destaque: o próximo no caminho até o site. Publicado não tem próximo. */
export function proximoPasso(status: StatusConteudo): Passo | null {
  const passo = AVANCO[status]
  return passo && TRANSICOES[status].includes(passo.para) ? passo : null
}

/** Os demais caminhos permitidos (voltar, tirar do site, arquivar), em botões discretos. */
export function outrosPassos(status: StatusConteudo): Passo[] {
  const proximo = proximoPasso(status)?.para
  return TRANSICOES[status]
    .filter((para) => para !== proximo)
    .map((para) => ({ para, rotulo: RECUO[status]?.[para] ?? para }))
}

/** Posição na trilha (0 a 3); arquivado devolve -1. */
export function indicePasso(status: StatusConteudo): number {
  return (PASSOS_PUBLICACAO as readonly StatusConteudo[]).indexOf(status)
}
