import { Prisma } from '@prisma/client'
import { logAudit } from '@/lib/audit'
import { CRITERIOS_AVALIACAO_PADRAO } from '@/lib/avaliacao-criterios'
import { gateAcaoFase } from '@/lib/edital/gate'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/inscricoes/inscricoes.errors'
import type { AvaliacaoInput } from '@shared/schemas/avaliacao.schema'
import { avaliacaoRepository } from './avaliacao.repository'
import { calcularNotaTotal } from './avaliacao.calculator'
import { AvaliacaoFinalizadaError, AvaliacaoNaoAtribuidaError, ForaDaFaseError } from './avaliacao.errors'

export async function getAvaliacao(inscricaoId: string, avaliadorId: string, isAdmin: boolean) {
  const inscricao = await avaliacaoRepository.findInscricaoComAvaliacao(inscricaoId, avaliadorId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()

  const avaliacao = inscricao.avaliacoes[0] ?? null
  if (!isAdmin && avaliacao === null) throw new AvaliacaoNaoAtribuidaError()

  return { avaliacao, criterios: [...CRITERIOS_AVALIACAO_PADRAO], inscricaoStatus: inscricao.status }
}

export async function saveAvaliacao(
  inscricaoId: string,
  data: AvaliacaoInput,
  avaliadorId: string,
  isAdmin: boolean,
) {
  const inscricao = await avaliacaoRepository.findInscricaoParaSalvar(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()

  const gate = gateAcaoFase({
    editalStatus: inscricao.edital.status,
    acao: 'avaliar',
    role: isAdmin ? 'ADMIN' : 'AVALIADOR',
    override: data.adminOverride,
  })

  if (!gate.ok) {
    await logAudit({
      userId: avaliadorId,
      action: 'AVALIACAO_FORA_DA_FASE_BLOQUEADA',
      entity: 'Inscricao',
      entityId: inscricaoId,
      details: { editalStatus: inscricao.edital.status, motivo: gate.mensagem },
    })
    throw new ForaDaFaseError(gate.mensagem)
  }

  const existente = await avaliacaoRepository.findAvaliacao(inscricaoId, avaliadorId)
  if (existente?.finalizada && !isAdmin) throw new AvaliacaoFinalizadaError()

  const avaliacao = await avaliacaoRepository.upsertAvaliacao(inscricaoId, avaliadorId, {
    notas: data.notas as Prisma.InputJsonValue,
    parecer: data.parecer ?? null,
    notaTotal: calcularNotaTotal(data.notas),
    finalizada: data.finalizar,
  })

  await logAudit({
    userId: avaliadorId,
    action: data.finalizar ? 'AVALIACAO_FINALIZADA' : 'AVALIACAO_RASCUNHO_SALVO',
    entity: 'Avaliacao',
    entityId: avaliacao.id,
    details: {
      inscricaoId,
      inscricaoNumero: inscricao.numero,
      notaTotal: avaliacao.notaTotal === null ? null : String(avaliacao.notaTotal),
      finalizada: avaliacao.finalizada,
      adminOverride: gate.overrideUsed,
      adminOverrideJustificativa: gate.overrideUsed ? data.adminOverrideJustificativa : null,
      editalStatus: inscricao.edital.status,
    },
  })

  return avaliacao
}
