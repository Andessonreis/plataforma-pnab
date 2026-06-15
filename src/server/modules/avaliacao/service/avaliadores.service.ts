import { prisma } from '@server/lib/db'
import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { gateAcaoFase } from '@shared/edital/gate'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/errors/inscricoes.errors'
import { ForaDaFaseError } from '@server/lib/http/fase.errors'
import { avaliadoresRepository } from '../repository/avaliadores.repository'
import {
  AvaliacaoFinalizadaError,
  AvaliacaoNaoEncontradaError,
  AvaliadoresInvalidosError,
  StatusInscricaoInvalidoError,
} from '../errors/avaliadores.errors'

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

  const result = await prisma.$transaction(async (tx) => {
    const inscricao = await tx.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, status: true, numero: true },
    })
    if (!inscricao) throw new InscricaoNaoEncontradaError()
    if (inscricao.status !== 'HABILITADA' && inscricao.status !== 'EM_AVALIACAO') {
      throw new StatusInscricaoInvalidoError()
    }

    const avaliadores = await tx.user.findMany({
      where: { id: { in: avaliadorIds }, role: 'AVALIADOR', ativo: true },
      select: { id: true },
    })
    if (avaliadores.length !== avaliadorIds.length) throw new AvaliadoresInvalidosError()

    const existing = await tx.avaliacao.findMany({
      where: { inscricaoId, avaliadorId: { in: avaliadorIds } },
      select: { avaliadorId: true },
    })
    const existingIds = new Set(existing.map((e) => e.avaliadorId))
    const newIds = avaliadorIds.filter((id) => !existingIds.has(id))

    if (newIds.length === 0) return { created: 0, newIds: [] as string[], numero: inscricao.numero }

    await tx.avaliacao.createMany({
      data: newIds.map((avaliadorId) => ({
        inscricaoId,
        avaliadorId,
        notas: [],
        notaTotal: null,
        finalizada: false,
      })),
    })

    if (inscricao.status === 'HABILITADA') {
      await tx.inscricao.update({ where: { id: inscricaoId }, data: { status: 'EM_AVALIACAO' } })
    }

    return { created: newIds.length, newIds, numero: inscricao.numero }
  })

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
  await prisma.$transaction(async (tx) => {
    const inscricao = await tx.inscricao.findUnique({
      where: { id: inscricaoId },
      select: { id: true, status: true },
    })
    if (!inscricao) throw new InscricaoNaoEncontradaError()

    const avaliacao = await tx.avaliacao.findUnique({
      where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } },
      select: { id: true, finalizada: true },
    })
    if (!avaliacao) throw new AvaliacaoNaoEncontradaError()
    if (avaliacao.finalizada) throw new AvaliacaoFinalizadaError()

    await tx.avaliacao.delete({ where: { inscricaoId_avaliadorId: { inscricaoId, avaliadorId } } })

    const remaining = await tx.avaliacao.count({ where: { inscricaoId } })
    if (remaining === 0 && inscricao.status === 'EM_AVALIACAO') {
      await tx.inscricao.update({ where: { id: inscricaoId }, data: { status: 'HABILITADA' } })
    }
  })

  await logAudit({
    userId: adminId,
    action: AUDIT_ACTIONS.AVALIADOR_REMOVIDO,
    entity: 'Inscricao',
    entityId: inscricaoId,
    details: { avaliadorId },
  })

  return { mensagem: 'Avaliador removido.' }
}
