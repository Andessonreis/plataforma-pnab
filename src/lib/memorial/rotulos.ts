import type { MemorialTipoAcervo, StatusConteudo } from '@prisma/client'

/**
 * Valores e nomes dos enums do Memorial em um lugar só. Sem dependência de servidor:
 * serve tanto aos schemas Zod quanto às telas do painel e do site.
 */

export const STATUS_CONTEUDO = [
  'RASCUNHO',
  'EM_REVISAO',
  'APROVADO',
  'PUBLICADO',
  'ARQUIVADO',
] as const satisfies readonly StatusConteudo[]

export const ROTULO_STATUS: Record<StatusConteudo, string> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em revisão',
  APROVADO: 'Aprovado',
  PUBLICADO: 'Publicado',
  ARQUIVADO: 'Arquivado',
}

export const TIPOS_ACERVO = [
  'FOTOGRAFIA',
  'DOCUMENTO',
  'OBJETO',
  'VIDEO',
  'AUDIO',
  'CARTAZ',
  'JORNAL',
  'REGISTRO_HISTORICO',
  'DEPOIMENTO',
  'PUBLICACAO',
  'OUTRO',
] as const satisfies readonly MemorialTipoAcervo[]

export const ROTULO_TIPO_ACERVO: Record<MemorialTipoAcervo, string> = {
  FOTOGRAFIA: 'Fotografia',
  DOCUMENTO: 'Documento',
  OBJETO: 'Objeto',
  VIDEO: 'Vídeo',
  AUDIO: 'Áudio',
  CARTAZ: 'Cartaz',
  JORNAL: 'Jornal',
  REGISTRO_HISTORICO: 'Registro histórico',
  DEPOIMENTO: 'Depoimento',
  PUBLICACAO: 'Publicação',
  OUTRO: 'Outro',
}

/** "1950" → "Anos 1950". A década é guardada pelo primeiro ano. */
export function rotuloDecada(decada: number): string {
  return `Anos ${decada}`
}
