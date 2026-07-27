import type { EditalStatus } from '@prisma/client'
import type { BadgeVariant } from '@/components/ui'
import type { AcaoJanela, CronogramaDisplayItem } from '@/types/cronograma'
import { getCronogramaItemStatus } from '@/lib/utils/cronograma'

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

// Mapa de ações janeladas/marcos do cronograma → badge público.
// Usado pra dar ao cidadão um label fiel ao marco corrente, em vez do status
// admin (que só transita entre fases grandes — HABILITACAO → AVALIACAO etc.
// e fica "Em Habilitação" mesmo durante publicações intermediárias).
const ACAO_PUBLIC_DISPLAY: Partial<Record<AcaoJanela, StatusDisplay>> = {
  PUBLICACAO_INSCRITOS: { label: 'Inscritos publicados', badgeVariant: 'info' },
  PUBLICACAO_HABILITADOS: { label: 'Habilitados publicados', badgeVariant: 'info' },
  PUBLICACAO_HABILITADOS_POS_RECURSOS: { label: 'Habilitados pós-recursos', badgeVariant: 'info' },
  RECURSO_EDITAL_JANELA: { label: 'Prazo de recurso contra o edital', badgeVariant: 'warning' },
  RECURSO_HABILITACAO_JANELA: { label: 'Prazo de recursos', badgeVariant: 'warning' },
  RECURSO_RESULTADO_JANELA: { label: 'Prazo de recursos', badgeVariant: 'warning' },
}

/**
 * Status display para a página PÚBLICA: deriva do marco 'current' do cronograma.
 *
 * Ordem de prioridade do label:
 *   1. Custom item com `acao` conhecida → mapping em ACAO_PUBLIC_DISPLAY
 *   2. Item de fase fixa → mesmo display do admin (STATUS_MAP[fase])
 *   3. Custom item sem acao → usa o próprio item.label
 *   4. Sem marco corrente (antes de tudo / depois de tudo) → fallback admin
 *
 * Mantém Edital.status no banco intacto — só muda o que o cidadão vê.
 */
export function getPublicStatusDisplay(
  cronograma: CronogramaDisplayItem[],
  editalStatus: EditalStatus,
  now: Date = new Date(),
): StatusDisplay {
  for (let i = 0; i < cronograma.length; i++) {
    if (getCronogramaItemStatus(cronograma, i, now) !== 'current') continue

    const item = cronograma[i]
    if (item.acao && ACAO_PUBLIC_DISPLAY[item.acao]) {
      return ACAO_PUBLIC_DISPLAY[item.acao]!
    }
    if (item.fase) {
      return STATUS_MAP[item.fase]
    }
    return { label: item.label, badgeVariant: 'warning' }
  }

  return STATUS_MAP[editalStatus]
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
