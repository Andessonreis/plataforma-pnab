import type { InscricaoStatus } from '@prisma/client'

export type StatusBucketKey = 'todas' | 'rascunho' | 'andamento' | 'contempladas' | 'nao_contempladas'

interface StatusBucket {
  label: string
  /** null = sem filtro, cobre todos os status */
  statuses: InscricaoStatus[] | null
}

// Agrupamento por bucket visível ao proponente — mais simples que o enum
// completo de InscricaoStatus (11 valores), que é granularidade de backoffice.
export const STATUS_BUCKETS: Record<StatusBucketKey, StatusBucket> = {
  todas: { label: 'Todas', statuses: null },
  rascunho: { label: 'Rascunhos', statuses: ['RASCUNHO'] },
  andamento: {
    label: 'Em andamento',
    statuses: ['ENVIADA', 'HABILITADA', 'EM_AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO_ABERTO', 'RESULTADO_FINAL'],
  },
  contempladas: { label: 'Contempladas', statuses: ['CONTEMPLADA', 'SUPLENTE'] },
  nao_contempladas: { label: 'Não contempladas', statuses: ['INABILITADA', 'NAO_CONTEMPLADA'] },
}

export function resolveBucketKey(value: string | undefined): StatusBucketKey {
  return value !== undefined && value in STATUS_BUCKETS ? (value as StatusBucketKey) : 'todas'
}

export function contarBucket(
  statuses: InscricaoStatus[] | null,
  contagemPorStatus: Map<InscricaoStatus, number>,
  totalGeral: number,
): number {
  if (!statuses) return totalGeral
  return statuses.reduce((soma, status) => soma + (contagemPorStatus.get(status) ?? 0), 0)
}
