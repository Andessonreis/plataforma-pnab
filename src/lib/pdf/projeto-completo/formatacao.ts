/**
 * Formatação dos valores do formulário de inscrição para impressão.
 *
 * Campos `tabela`/`grupo_repetivel` persistem array de objetos — cada item vira
 * um bloco legível usando os labels de `colunas`/`subcampos` do formulário, em
 * vez do JSON bruto que o proponente nunca preencheu como texto.
 */
import type { CampoFormulario } from '@/types/campo-formulario'

/** Status legíveis para inscrição. */
export const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  HABILITADA: 'Habilitada',
  INABILITADA: 'Inabilitada',
  EM_AVALIACAO: 'Em avaliação',
  RESULTADO_PRELIMINAR: 'Resultado preliminar',
  RECURSO_ABERTO: 'Recurso aberto',
  RESULTADO_FINAL: 'Resultado final',
  CONTEMPLADA: 'Contemplada',
  NAO_CONTEMPLADA: 'Não contemplada',
  SUPLENTE: 'Suplente',
}

const TIPOS_PROPONENTE: Record<string, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica',
  MEI: 'Microempreendedor Individual (MEI)',
  COLETIVO: 'Coletivo Cultural',
}

export function formatTipoProponente(tipo: string): string {
  return TIPOS_PROPONENTE[tipo] ?? tipo
}

/** Definição completa de um campo, buscada pelo nome no formulário do edital. */
export function resolveCampoDef(
  key: string,
  camposFormulario: CampoFormulario[],
): CampoFormulario | undefined {
  return camposFormulario.find((campo) => campo.nome === key)
}

/** Label do campo; sem definição, converte camelCase/snake_case em texto legível. */
export function resolveCampoLabel(key: string, camposFormulario: CampoFormulario[]): string {
  const def = resolveCampoDef(key, camposFormulario)
  if (def) return def.label
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/**
 * Chaves de campo na ordem do formulário, com os órfãos (preenchidos mas fora
 * da definição atual do edital) no fim — nenhum dado do proponente some do PDF.
 */
export function buildCampoKeys(
  campos: Record<string, unknown>,
  camposFormulario: Array<{ nome: string }>,
): string[] {
  const preenchidos = Object.keys(campos).filter(
    (k) => campos[k] !== null && campos[k] !== undefined && campos[k] !== '',
  )
  const naOrdem = camposFormulario.map((campo) => campo.nome).filter((nome) => preenchidos.includes(nome))
  return [...naOrdem, ...preenchidos.filter((k) => !naOrdem.includes(k))]
}

/** Formata valor como moeda BRL. */
function formatCurrency(value: unknown): string {
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Formata data no padrão DD/MM/YYYY.
 *
 * Datas puras "YYYY-MM-DD" (sem hora, ex.: cronograma de execução) extraem
 * o dia/mês/ano direto da string — sem passar por `Date`, que interpretaria
 * como meia-noite UTC e, convertido pra America/Sao_Paulo (UTC-3), voltaria
 * pro dia anterior (28/09 virando 27/09 no PDF). Valores com hora (ISO
 * completo) continuam pelo caminho antigo, onde a conversão de fuso faz sentido.
 */
function formatDate(value: unknown): string {
  const str = String(value)
  const dataPura = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str)
  if (dataPura) {
    const [, ano, mes, dia] = dataPura
    return `${dia}/${mes}/${ano}`
  }
  const date = new Date(str)
  if (isNaN(date.getTime())) return str
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Formata um item de campo estruturado (uma linha de `tabela` ou um item de
 * `grupo_repetivel`) como bloco "Label: valor" legível, um por linha —
 * reaproveita formatCampoValue pra cada subcampo (datas e moedas dos
 * subcampos saem formatadas igual aos campos de primeiro nível).
 */
function formatarItemEstrutura(item: Record<string, unknown>, subcampos: CampoFormulario[]): string {
  return subcampos
    .map((sub) => {
      const valor = item[sub.nome]
      if (valor === null || valor === undefined || valor === '') return null
      return `${sub.label}: ${formatCampoValue(valor, sub, sub.nome)}`
    })
    .filter((linha): linha is string => linha !== null)
    .join('\n')
}

/**
 * Formata valor de campo conforme o tipo e o nome.
 *
 * Campos `tabela`/`grupo_repetivel` persistem array de objetos — cada item
 * vira um bloco legível usando os labels de `colunas`/`subcampos` do
 * formulário, em vez do JSON bruto que o proponente nunca preencheu como
 * texto (bug: campo com essas estruturas estourava a altura da linha no PDF
 * e sobrepunha o conteúdo seguinte — ver addLongTextField no gerador).
 */
export function formatCampoValue(value: unknown, campo: CampoFormulario | undefined, key: string): string {
  if (value === null || value === undefined || value === '') return '—'

  if (Array.isArray(value)) {
    if (value.length === 0) return '—'

    if (typeof value[0] === 'object' && value[0] !== null) {
      const subcampos = campo?.tipo === 'tabela' ? campo.colunas : campo?.subcampos
      const itens = value as Record<string, unknown>[]
      return itens
        .map((item, i) => {
          const prefixo = itens.length > 1 ? `${i + 1}. ` : ''
          const corpo = subcampos?.length
            ? formatarItemEstrutura(item, subcampos)
            // Sem definição de colunas/subcampos disponível — lista chave/valor bruta
            // como último recurso, ainda assim legível (nunca JSON.stringify aninhado).
            : Object.entries(item)
              .filter(([, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n')
          return prefixo + corpo
        })
        .join('\n\n')
    }

    // Array de valores simples (multiselect / outras fontes etc.)
    return value.map(String).join('; ')
  }

  const tipo = campo?.tipo ?? 'texto'
  if (tipo === 'moeda' || tipo === 'currency') return formatCurrency(value)
  // Fallback: campo com "valor" no nome e valor numérico → formata como moeda
  if (key.toLowerCase().includes('valor') && !isNaN(Number(value))) return formatCurrency(value)
  if (tipo === 'data' || tipo === 'date') return formatDate(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
