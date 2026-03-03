import type { EditalStatus } from '@prisma/client'
import type { BadgeVariant } from '@/components/ui'

interface StatusDisplay {
  label: string
  badgeVariant: BadgeVariant
}

const STATUS_MAP: Record<EditalStatus, StatusDisplay> = {
  RASCUNHO: {
    label: 'Rascunho',
    badgeVariant: 'neutral',
  },
  PUBLICADO: {
    label: 'Publicado',
    badgeVariant: 'info',
  },
  INSCRICOES_ABERTAS: {
    label: 'Inscrições Abertas',
    badgeVariant: 'success',
  },
  INSCRICOES_ENCERRADAS: {
    label: 'Inscrições Encerradas',
    badgeVariant: 'warning',
  },
  HABILITACAO: {
    label: 'Em Habilitação',
    badgeVariant: 'warning',
  },
  AVALIACAO: {
    label: 'Em Avaliação',
    badgeVariant: 'warning',
  },
  RESULTADO_PRELIMINAR: {
    label: 'Resultado Preliminar',
    badgeVariant: 'info',
  },
  RECURSO: {
    label: 'Fase de Recursos',
    badgeVariant: 'warning',
  },
  RESULTADO_FINAL: {
    label: 'Resultado Final',
    badgeVariant: 'info',
  },
  ENCERRADO: {
    label: 'Encerrado',
    badgeVariant: 'neutral',
  },
}

/**
 * Retorna label e variant do badge para o status do edital.
 */
export function getStatusDisplay(status: EditalStatus): StatusDisplay {
  return STATUS_MAP[status]
}

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
