'use server'

import { auth } from '@server/lib/auth'
import { prisma } from '@server/lib/db'
import { cumulativeStatuses } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'

const STATUS_OPTIONS: InscricaoStatus[] = [
  'ENVIADA',
  'HABILITADA',
  'INABILITADA',
  'EM_AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO_ABERTO',
  'RESULTADO_FINAL',
  'CONTEMPLADA',
  'NAO_CONTEMPLADA',
  'SUPLENTE',
]

export interface EditalInscricaoCounts {
  /** Contagens cumulativas por status (para o select do modal) */
  byStatus: Record<string, number>
  /** Total real de inscrições (sem duplicação) */
  total: number
}

export async function getInscricaoCountsByEdital(
  editalId: string,
): Promise<EditalInscricaoCounts> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return { byStatus: {}, total: 0 }

  // Buscar contagens brutas por status atual
  const rawCounts = await prisma.inscricao.groupBy({
    by: ['status'],
    where: { editalId, status: { not: 'RASCUNHO' as InscricaoStatus } },
    _count: true,
  })

  const rawMap = new Map(rawCounts.map((c) => [c.status, c._count]))

  // Total real = soma das contagens brutas (cada inscrição contada 1x)
  let total = 0
  for (const c of rawCounts) total += c._count

  // Contagens cumulativas por status
  const byStatus: Record<string, number> = {}
  for (const status of STATUS_OPTIONS) {
    const included = cumulativeStatuses[status]
    byStatus[status] = included.reduce((sum, s) => sum + (rawMap.get(s) ?? 0), 0)
  }

  return { byStatus, total }
}

