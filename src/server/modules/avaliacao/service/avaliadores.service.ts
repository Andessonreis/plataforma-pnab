import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { gateAcaoFase } from '@shared/edital/gate'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/errors/inscricoes.errors'
import { ForaDaFaseError } from '@server/lib/http/fase.errors'
import { avaliadoresRepository } from '../repository/avaliadores.repository'

export function listAvaliadores() {
  return avaliadoresRepository.listAvaliadores()
}

export async function assignAvaliadores(
  inscricaoId: string,
  avaliadorIds: string[],
  adminId: string,
  options?: { adminOverride?: boolean; adminOverrideJustificativa?: string },
) {
  const check = await avaliadoresRepository.findEditalStatusDaInscricao(inscricaoId)
  if (!check) throw new InscricaoNaoEncontradaError()

  const gate = gateAcaoFase({
    editalStatus: check.edital.status,
    acao: 'atribuir_avaliador',
    role: 'ADMIN',
    override: options?.adminOverride,
  })

  if (!gate.ok) {
    await logAudit({
      userId: adminId,
      action: 'AVALIADOR_ATRIBUIDO_FORA_DA_FASE_BLOQUEADO',
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: { editalStatus: check.edital.status, motivo: gate.mensagem },
    })
    throw new ForaDaFaseError(gate.mensagem)
  }

  const result = await avaliadoresRepository.atribuirAvaliadores(inscricaoId, avaliadorIds)

  if (result.created > 0) {
    await logAudit({
      userId: adminId,
      action: AUDIT_ACTIONS.AVALIADOR_ATRIBUIDO,
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: {
        avaliadorIds: result.newIds,
        numero: result.numero,
        adminOverride: gate.overrideUsed,
        adminOverrideJustificativa: gate.overrideUsed ? options?.adminOverrideJustificativa : null,
        editalStatus: check.edital.status,
      },
    })
  }

  return { atribuidos: result.created }
}

export async function removeAvaliador(inscricaoId: string, avaliadorId: string, adminId: string) {
  await avaliadoresRepository.removerAvaliador(inscricaoId, avaliadorId)

  await logAudit({
    userId: adminId,
    action: AUDIT_ACTIONS.AVALIADOR_REMOVIDO,
    entity: 'Inscricao',
    entityId: inscricaoId,
    details: { avaliadorId },
  })

  return { mensagem: 'Avaliador removido.' }
}
