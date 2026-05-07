/**
 * Gating por fase do edital.
 *
 * Habilitação só durante EditalStatus = HABILITACAO.
 * Avaliação (criar/editar/atribuir) só durante EditalStatus = AVALIACAO.
 *
 * Bugs #84 e #85 — exigência de UAT: "apenas e unicamente na sua fase
 * do edital". ADMIN pode forçar com override + justificativa auditada.
 */

import type { EditalStatus } from '@prisma/client'

export type FaseAcao = 'avaliar' | 'atribuir_avaliador' | 'habilitar'

const ORDEM_FASES: EditalStatus[] = [
  'RASCUNHO',
  'PUBLICADO',
  'INSCRICOES_ABERTAS',
  'INSCRICOES_ENCERRADAS',
  'HABILITACAO',
  'AVALIACAO',
  'RESULTADO_PRELIMINAR',
  'RECURSO',
  'RESULTADO_FINAL',
  'ENCERRADO',
]

function faseEsperada(acao: FaseAcao): EditalStatus {
  return acao === 'habilitar' ? 'HABILITACAO' : 'AVALIACAO'
}

export function podeHabilitar(status: EditalStatus): boolean {
  return status === 'HABILITACAO'
}

export function podeAvaliar(status: EditalStatus): boolean {
  return status === 'AVALIACAO'
}

export function podeAtribuirAvaliador(status: EditalStatus): boolean {
  // Atribuição só faz sentido durante a fase de avaliação.
  return status === 'AVALIACAO'
}

export function podeAcao(status: EditalStatus, acao: FaseAcao): boolean {
  if (acao === 'habilitar') return podeHabilitar(status)
  if (acao === 'avaliar') return podeAvaliar(status)
  return podeAtribuirAvaliador(status)
}

/**
 * Mensagem clara para o usuário quando tenta agir fora da fase do edital.
 * Distingue 'ainda não iniciada' (status anterior) de 'encerrada' (posterior).
 */
export function mensagemForaDaFase(status: EditalStatus, acao: FaseAcao): string {
  const esperada = faseEsperada(acao)
  const idxAtual = ORDEM_FASES.indexOf(status)
  const idxEsperada = ORDEM_FASES.indexOf(esperada)

  const antes = idxAtual < idxEsperada
  const label = acao === 'habilitar' ? 'Habilitação' : 'Avaliação'

  if (antes) return `${label} ainda não iniciada`
  return `Período de ${label.toLowerCase()} encerrado`
}
