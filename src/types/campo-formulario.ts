import type { TipoProponente } from '@prisma/client'

export interface CampoFormulario {
  nome: string
  label: string
  tipo: 'texto' | 'text' | 'textarea' | 'select' | 'multiselect' | 'numero' | 'number' | 'moeda' | 'currency' | 'data' | 'date' | 'arquivo'
  obrigatorio?: boolean
  placeholder?: string
  opcoes?: string[]
  hint?: string
  minLength?: number | null
  maxLength?: number | null
  tiposProponente?: TipoProponente[] | null
}

/**
 * Filtra campos visíveis para um tipo de proponente.
 * - Campo sem tiposProponente (null/undefined/[]) = visível para todos
 * - Se tipoProponente do usuário é null/undefined = mostra todos (fallback seguro)
 */
export function filterCamposByTipo(
  campos: CampoFormulario[],
  tipoProponente: TipoProponente | null | undefined,
): CampoFormulario[] {
  return campos.filter((campo) => {
    if (!campo.tiposProponente || campo.tiposProponente.length === 0) return true
    if (!tipoProponente) return true
    return campo.tiposProponente.includes(tipoProponente)
  })
}
