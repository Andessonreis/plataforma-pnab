import type { CampoFormulario } from './campo-formulario'

/**
 * Etapa customizada do wizard de inscrição.
 *
 * Cada edital pode definir 0..N etapas adicionais, renderizadas entre
 * as etapas fixas "dados" e "anexos" na ordem definida.
 *
 * Os dados preenchidos nestas etapas são persistidos no mesmo
 * `Inscricao.campos` (JSON) usando o `nome` de cada campo como chave —
 * por isso, ao configurar as etapas, o admin deve garantir que os
 * nomes dos campos sejam únicos em todo o edital.
 */
export interface EtapaCustomizada {
  /** Identificador estável (slug) da etapa. Usado para o indicador visual e rota de rascunho. */
  id: string
  /** Título exibido no wizard (ex.: "Plano de Trabalho"). */
  titulo: string
  /** Descrição/instruções opcionais exibidas no topo da etapa. */
  descricao?: string
  /** Ordem relativa às demais etapas customizadas (menor = primeiro). */
  ordem: number
  /** Campos do formulário desta etapa (mesmo shape usado em `camposFormulario`). */
  campos: CampoFormulario[]
}

/**
 * Extrai todos os campos de todas as etapas customizadas, mantendo a ordem.
 * Útil para validação de submit e geração de PDFs.
 */
export function flattenEtapasCustomizadas(
  etapas: EtapaCustomizada[],
): CampoFormulario[] {
  return [...etapas]
    .sort((a, b) => a.ordem - b.ordem)
    .flatMap((e) => e.campos)
}

/**
 * Type guard para validar em runtime se um valor é um array válido de
 * etapas customizadas — útil ao ler o JSON do Prisma.
 */
export function isEtapasCustomizadasArray(
  value: unknown,
): value is EtapaCustomizada[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (e) =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as EtapaCustomizada).id === 'string' &&
      typeof (e as EtapaCustomizada).titulo === 'string' &&
      typeof (e as EtapaCustomizada).ordem === 'number' &&
      Array.isArray((e as EtapaCustomizada).campos),
  )
}
