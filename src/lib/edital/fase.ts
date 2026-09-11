/**
 * Gating por fase do edital.
 *
 * Habilitação só durante EditalStatus = HABILITACAO.
 * Avaliação (criar/editar/atribuir) durante EditalStatus = AVALIACAO — ou,
 * por inscrição, mesmo com o edital ainda em HABILITACAO, desde que aquela
 * inscrição específica já esteja HABILITADA ou EM_AVALIACAO. Habilitação e
 * avaliação correm em paralelo: quem já foi conferido não espera o resto da
 * fila terminar pra ir pro avaliador.
 *
 * Bugs #84 e #85 — exigência de UAT: "apenas e unicamente na sua fase
 * do edital". ADMIN pode forçar com override + justificativa auditada.
 */

import type { EditalStatus, InscricaoStatus } from '@prisma/client'
import { STATUS_EM_PROCESSO_AVALIACAO } from '@/lib/services/avaliacao-buckets'

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

/**
 * A decisão de um recurso só fica visível ao proponente quando o edital
 * avança para a fase seguinte à do recurso (resposta divulgada "no fim da fase").
 */
const FASE_LIBERACAO_RECURSO: Record<string, EditalStatus> = {
  HABILITACAO: 'HABILITACAO',
  // Recursos contra o resultado preliminar são julgados durante a fase
  // RECURSO — a decisão só é divulgada junto com o resultado final.
  RESULTADO_PRELIMINAR: 'RESULTADO_FINAL',
  RESULTADO_FINAL: 'RESULTADO_FINAL',
}

export function respostaRecursoLiberada(faseRecurso: string, editalStatus: EditalStatus): boolean {
  const liberaEm = FASE_LIBERACAO_RECURSO[faseRecurso]
  if (!liberaEm) return false
  return ORDEM_FASES.indexOf(editalStatus) >= ORDEM_FASES.indexOf(liberaEm)
}

export function podeHabilitar(status: EditalStatus): boolean {
  return status === 'HABILITACAO'
}

export function podeAvaliar(status: EditalStatus, inscricaoStatus?: InscricaoStatus): boolean {
  if (status === 'AVALIACAO') return true
  if (status === 'HABILITACAO' && inscricaoStatus) {
    return STATUS_EM_PROCESSO_AVALIACAO.includes(inscricaoStatus)
  }
  return false
}

export function podeAtribuirAvaliador(status: EditalStatus, inscricaoStatus?: InscricaoStatus): boolean {
  return podeAvaliar(status, inscricaoStatus)
}

export function podeAcao(status: EditalStatus, acao: FaseAcao, inscricaoStatus?: InscricaoStatus): boolean {
  if (acao === 'habilitar') return podeHabilitar(status)
  if (acao === 'avaliar') return podeAvaliar(status, inscricaoStatus)
  return podeAtribuirAvaliador(status, inscricaoStatus)
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
