import { AUDIT_ACTIONS, logAudit } from '@server/lib/audit'
import { EditalContempladosNaoEncontradoError } from '@server/modules/editais/errors/contemplados.errors'
import { contempladosRepository } from '../repository/contemplados.repository'

export async function importContemplados(
  editalId: string,
  contemplados: Array<{ inscricaoId: string; valorAprovado: number }>,
  userId: string,
  ip?: string,
) {
  const edital = await contempladosRepository.findEditalById(editalId)
  if (!edital) throw new EditalContempladosNaoEncontradoError()

  const updates = contemplados.map((c) =>
    contempladosRepository.upsertProjetoApoiado(c.inscricaoId, c.valorAprovado),
  )

  await contempladosRepository.transaction(updates)

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.IMPORTACAO_CONTEMPLADOS,
    entity: 'Edital',
    entityId: editalId,
    details: { total: contemplados.length },
    ip,
  })

  return { imported: contemplados.length }
}
