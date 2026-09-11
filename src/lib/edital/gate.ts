/**
 * Server-side gate de fase do edital.
 *
 * Encapsula a lógica de checar fase + permitir override de ADMIN,
 * para ser reusada em routes admin e services v1 sem duplicação.
 */

import type { EditalStatus, InscricaoStatus, UserRole } from '@prisma/client'
import { podeAcao, mensagemForaDaFase, type FaseAcao } from './fase'

export type GateInput = {
  editalStatus: EditalStatus
  acao: FaseAcao
  role: UserRole
  override?: boolean
  /** Necessário pra 'avaliar'/'atribuir_avaliador' liberarem em paralelo à habilitação — ver fase.ts. */
  inscricaoStatus?: InscricaoStatus
}

export type GateResult =
  | { ok: true; overrideUsed: false }
  | { ok: true; overrideUsed: true }
  | { ok: false; mensagem: string }

/**
 * Decide se a ação pode prosseguir.
 *
 * - Dentro da fase → ok, sem override
 * - Fora da fase + ADMIN com override=true → ok, override registrado
 * - Fora da fase em qualquer outro caso → bloqueia com mensagem clara
 */
export function gateAcaoFase(input: GateInput): GateResult {
  const { editalStatus, acao, role, override, inscricaoStatus } = input

  if (podeAcao(editalStatus, acao, inscricaoStatus)) {
    return { ok: true, overrideUsed: false }
  }

  if (role === 'ADMIN' && override === true) {
    return { ok: true, overrideUsed: true }
  }

  return { ok: false, mensagem: mensagemForaDaFase(editalStatus, acao) }
}
