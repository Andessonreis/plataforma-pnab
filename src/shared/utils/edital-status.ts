import type { EditalStatus } from '@prisma/client'

/**
 * Status que indicam que o edital está "aberto" para filtro público.
 */
export const OPEN_STATUSES: EditalStatus[] = [
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
]

/**
 * Status que indicam que o edital está "encerrado" para filtro público.
 */
export const CLOSED_STATUSES: EditalStatus[] = [
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]
