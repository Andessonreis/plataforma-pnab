import type { MemorialTipoAcervo, StatusConteudo } from '@prisma/client'

/**
 * Ciclo de vida do conteúdo do Memorial: RASCUNHO → EM_REVISAO → APROVADO → PUBLICADO,
 * com ARQUIVADO como saída. Nada vai ao público sem passar por aprovação humana.
 */
export const TRANSICOES: Record<StatusConteudo, readonly StatusConteudo[]> = {
  RASCUNHO: ['EM_REVISAO', 'ARQUIVADO'],
  EM_REVISAO: ['RASCUNHO', 'APROVADO'],
  APROVADO: ['PUBLICADO', 'EM_REVISAO'],
  // Despublicar volta para APROVADO, sem perder a revisão já feita
  PUBLICADO: ['APROVADO', 'ARQUIVADO'],
  ARQUIVADO: ['RASCUNHO'],
}

export function podeTransicionar(de: StatusConteudo, para: StatusConteudo): boolean {
  return TRANSICOES[de].includes(para)
}

type Texto = string | null | undefined

function vazio(valor: Texto): boolean {
  return !valor || valor.trim() === ''
}

function faltando(campos: [Texto, string][]): string[] {
  return campos.filter(([valor]) => vazio(valor)).map(([, nome]) => nome)
}

/*
 * Cada função devolve o que falta para publicar, em linguagem da equipe.
 * Lista vazia = pode publicar.
 */

export function pendenciasExposicao(r: { titulo: Texto; descricao: Texto; capaUrl: Texto }) {
  return faltando([
    [r.titulo, 'título'],
    [r.descricao, 'descrição'],
    [r.capaUrl, 'imagem de capa'],
  ])
}

export function pendenciasPessoa(r: { nome: Texto; biografia: Texto }) {
  return faltando([
    [r.nome, 'nome'],
    [r.biografia, 'biografia'],
  ])
}

export function pendenciasEvento(r: { titulo: Texto; descricao: Texto; ano: number | null }) {
  const lista = faltando([
    [r.titulo, 'título'],
    [r.descricao, 'descrição'],
  ])
  // Sem ano o evento não tem lugar na linha do tempo
  if (r.ano === null) lista.push('ano')
  return lista
}

/**
 * Fotografia só vai ao público com crédito e autorização de uso registrados:
 * o acervo tem direitos de terceiros e o sistema não pode tratar toda imagem como livre.
 */
export function pendenciasItem(r: {
  tipo: MemorialTipoAcervo
  titulo: Texto
  descricao: Texto
  legenda: Texto
  arquivoUrl: Texto
  credito: Texto
  autorizado: boolean
}) {
  const lista = faltando([[r.titulo, 'título']])
  if (r.tipo === 'FOTOGRAFIA') {
    lista.push(...faltando([[r.arquivoUrl, 'arquivo da fotografia'], [r.credito, 'crédito']]))
    if (!r.autorizado) lista.push('autorização de uso')
  } else if (vazio(r.descricao) && vazio(r.legenda)) {
    lista.push('descrição ou legenda')
  }
  return lista
}
