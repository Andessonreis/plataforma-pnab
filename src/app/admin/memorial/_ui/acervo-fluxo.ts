import type { StatusConteudo } from '@prisma/client'
import { TRANSICOES } from '@/lib/memorial/publicacao'

/** Etapas mostradas como trilha. Arquivado fica fora: é saída, não etapa. */
export const PASSOS_PUBLICACAO = ['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO'] as const satisfies readonly StatusConteudo[]

/** Próximo passo natural de cada situação; publicado não tem avanço, só recuo. */
const AVANCO: Partial<Record<StatusConteudo, StatusConteudo>> = {
  RASCUNHO: 'EM_REVISAO',
  EM_REVISAO: 'APROVADO',
  APROVADO: 'PUBLICADO',
  ARQUIVADO: 'RASCUNHO',
}

export interface AcaoSituacao {
  para: StatusConteudo
  rotulo: string
}

function rotulo(de: StatusConteudo, para: StatusConteudo): string {
  if (de === 'ARQUIVADO') return 'Reabrir como rascunho'
  if (de === 'PUBLICADO' && para === 'APROVADO') return 'Tirar do site'
  if (de === 'APROVADO' && para === 'EM_REVISAO') return 'Devolver para revisão'
  if (de === 'EM_REVISAO' && para === 'RASCUNHO') return 'Voltar para rascunho'
  const nomes: Record<StatusConteudo, string> = {
    RASCUNHO: 'Voltar para rascunho',
    EM_REVISAO: 'Enviar para revisão',
    APROVADO: 'Aprovar',
    PUBLICADO: 'Publicar no site',
    ARQUIVADO: 'Arquivar',
  }
  return nomes[para]
}

/**
 * Separa o único botão de destaque (o avanço) das saídas secundárias
 * (recuar, tirar do site, arquivar), seguindo as transições permitidas.
 */
export function acoesDaSituacao(status: StatusConteudo): { principal: AcaoSituacao | null; secundarias: AcaoSituacao[] } {
  const avanco = AVANCO[status]
  const principal = avanco && TRANSICOES[status].includes(avanco) ? { para: avanco, rotulo: rotulo(status, avanco) } : null
  const secundarias = TRANSICOES[status]
    .filter((para) => para !== avanco)
    .map((para) => ({ para, rotulo: rotulo(status, para) }))
  return { principal, secundarias }
}

/** Posição na trilha; -1 para arquivado. */
export function indicePasso(status: StatusConteudo): number {
  return (PASSOS_PUBLICACAO as readonly StatusConteudo[]).indexOf(status)
}

/** ["crédito", "autorização"] → "crédito e autorização". */
export function juntarLista(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? ''
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}
