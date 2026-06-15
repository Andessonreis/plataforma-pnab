import type { InscricaoStatus } from '@prisma/client'
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { cumulativeStatuses } from '@/lib/status-maps'
import { exportInscricoesRepository } from '../repository/export-inscricoes.repository'

const HEADERS = [
  'Numero',
  'Nome',
  'CPF/CNPJ',
  'Email',
  'Edital',
  'Status',
  'Categoria',
  'Nota Final',
  'Enviada em',
]

function csvSafe(value: string): string {
  return /^[=+@\-\t\r]/.test(value) ? `'${value}` : value
}

export async function exportInscricoesCsv(
  editalId: string | undefined,
  status: string | undefined,
  userId: string,
  ip?: string,
) {
  const statuses = status
    ? (cumulativeStatuses[status as InscricaoStatus] ?? [status as InscricaoStatus])
    : undefined

  const inscricoes = await exportInscricoesRepository.findParaExport(editalId, statuses)

  const rows = inscricoes.map((i) => [
    csvSafe(String(i.numero ?? '')),
    `"${csvSafe(i.proponente.nome)}"`,
    csvSafe(i.proponente.cpfCnpj ?? ''),
    csvSafe(i.proponente.email),
    `"${csvSafe(i.edital.titulo)}"`,
    csvSafe(i.status),
    csvSafe(i.categoria ?? ''),
    i.notaFinal ? String(i.notaFinal) : '',
    i.submittedAt
      ? i.submittedAt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : '',
  ])

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.EXPORTACAO_CSV,
    entity: 'Inscricao',
    details: { editalId: editalId ?? 'todos', status: status ?? 'todos', total: inscricoes.length },
    ip,
  })

  const bom = '﻿'
  return bom + [HEADERS.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
}
