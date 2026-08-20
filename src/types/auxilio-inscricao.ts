// Marcação de "inscrição preenchida com auxílio de terceiros" — pedido específico
// da Secretaria pro edital Mestres e Mestras (público majoritariamente idoso).
// Persiste dentro de Inscricao.campos (chave reservada), sem exigir migration:
// o campo já é um Json livre e cada edital usa um subconjunto de chaves diferente.

export interface AuxilioInscricao {
  ativo: boolean
  nomeAuxiliar: string
  cpfAuxiliar: string
}

export const AUXILIO_INSCRICAO_CAMPO = 'auxilioInscricao'

export const AUXILIO_INSCRICAO_VAZIO: AuxilioInscricao = {
  ativo: false,
  nomeAuxiliar: '',
  cpfAuxiliar: '',
}

export function parseAuxilioInscricao(value: unknown): AuxilioInscricao {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return AUXILIO_INSCRICAO_VAZIO
  const v = value as Record<string, unknown>
  return {
    ativo: v.ativo === true,
    nomeAuxiliar: typeof v.nomeAuxiliar === 'string' ? v.nomeAuxiliar : '',
    cpfAuxiliar: typeof v.cpfAuxiliar === 'string' ? v.cpfAuxiliar : '',
  }
}
