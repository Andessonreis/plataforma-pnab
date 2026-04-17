import type { TipoProponente } from '@prisma/client'

export type CampoTipoSimples =
  | 'texto' | 'text'
  | 'textarea'
  | 'select' | 'multiselect'
  | 'numero' | 'number'
  | 'moeda' | 'currency'
  | 'data' | 'date'
  | 'arquivo'

export type CampoTipoEstrutura = 'info' | 'tabela' | 'grupo_repetivel'

export type CampoTipo = CampoTipoSimples | CampoTipoEstrutura

export interface CampoFormulario {
  nome: string
  label: string
  tipo: CampoTipo
  obrigatorio?: boolean
  placeholder?: string
  opcoes?: string[]
  hint?: string
  minLength?: number | null
  maxLength?: number | null
  tiposProponente?: TipoProponente[] | null

  // tipo === 'info' — bloco informativo (não editável)
  conteudo?: string
  variante?: 'info' | 'atencao' | 'alerta'

  // tipo === 'tabela' — múltiplas linhas com colunas pré-definidas
  colunas?: CampoFormulario[]
  linhaMin?: number
  linhaMax?: number

  // tipo === 'grupo_repetivel' — grupo de subcampos que repete N vezes
  subcampos?: CampoFormulario[]
  labelItem?: string
  itemMin?: number
  itemMax?: number
}

/**
 * Retorna true se o tipo é estrutural (não persiste valor "simples" no form).
 * - info: não persiste nada
 * - tabela / grupo_repetivel: persistem array de objetos
 */
export function isCampoEstrutura(tipo: CampoTipo): boolean {
  return tipo === 'info' || tipo === 'tabela' || tipo === 'grupo_repetivel'
}

/**
 * Achata todos os campos "folha" (preenchíveis) de um conjunto de campos,
 * incluindo colunas de tabelas e subcampos de grupos repetíveis.
 * Ignora blocos `info`. Usado para validação de obrigatórios.
 */
export function flattenCamposPreenchiveis(campos: CampoFormulario[]): CampoFormulario[] {
  const out: CampoFormulario[] = []
  for (const c of campos) {
    if (c.tipo === 'info') continue
    if (c.tipo === 'tabela') {
      for (const col of c.colunas ?? []) out.push(col)
      continue
    }
    if (c.tipo === 'grupo_repetivel') {
      for (const sub of c.subcampos ?? []) out.push(sub)
      continue
    }
    out.push(c)
  }
  return out
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
