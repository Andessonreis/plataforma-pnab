import { logAudit, AUDIT_ACTIONS } from '@/lib/audit'
import { exportInscricoesRepository } from './export-inscricoes.repository'

const CSV_HEADER =
  'Número,Edital,Proponente,CPF/CNPJ,Email,Categoria,Status,Nota Final,Avaliações,Data Envio\n'

export async function exportInscricoesCsv(editalId: string | undefined, userId: string, ip?: string) {
  const inscricoes = await exportInscricoesRepository.findParaExport(editalId)

  const rows = inscricoes.map((i) =>
    [
      i.numero,
      `"${i.edital.titulo}"`,
      `"${i.proponente.nome}"`,
      i.proponente.cpfCnpj ?? '',
      i.proponente.email,
      i.categoria ?? '',
      i.status,
      i.notaFinal ? Number(i.notaFinal) : '',
      i._count.avaliacoes,
      i.submittedAt ? i.submittedAt.toISOString() : '',
    ].join(','),
  )

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.EXPORTACAO_CSV,
    entity: 'Inscricao',
    details: { editalId, total: inscricoes.length },
    ip,
  })

  return CSV_HEADER + rows.join('\n')
}
