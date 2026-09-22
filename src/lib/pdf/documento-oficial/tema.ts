/**
 * Tema dos documentos oficiais do portal.
 *
 * A referência é o Diário Oficial do Município de Irecê: papel praticamente
 * monocromático, régua institucional no topo, tarjas pretas rotulando cada
 * bloco e tabelas de grade fina. Cor entra só pela marca da Prefeitura — o que
 * o leitor tem que enxergar é o conteúdo, não o enfeite, e o documento precisa
 * continuar legível impresso em preto e branco ou fotocopiado.
 */

/** Nome oficial do órgão emissor, como assina nos documentos. */
export const NOME_ORGAO = 'Secretaria de Cultura e Turismo de Irecê'

export const CORES = {
  /** Preto das tarjas, réguas e títulos. */
  tinta: '#000000',
  /** Corpo de texto — preto puro cansa em bloco longo. */
  texto: '#111111',
  /** Linha de apoio: data, código, notas de rodapé. */
  apoio: '#555555',
  /** Fio das tabelas e das caixas. */
  fio: '#000000',
  /** Fundo do cabeçalho de tabela e das tarjas de metadado. */
  trama: '#e6e6e6',
  /** Fundo alternado de linha, usado só em listas longas. */
  tramaClara: '#f4f4f4',
  papel: '#ffffff',
} as const

export const FONTES = {
  titulo: 'Times-Bold',
  tituloItalico: 'Times-BoldItalic',
  corpo: 'Times-Roman',
  corpoItalico: 'Times-Italic',
  /** Cromo do documento: rótulos, cabeçalhos de tabela, dados tabulares. */
  rotulo: 'Helvetica-Bold',
  dado: 'Helvetica',
  dadoItalico: 'Helvetica-Oblique',
  /** Código e hash — dígito e letra precisam ter a mesma largura. */
  codigo: 'Courier-Bold',
} as const

export const PAGINA = {
  largura: 595.28,
  altura: 841.89,
  margem: { topo: 86, base: 60, esquerda: 50, direita: 50 },
} as const

export const LARGURA_UTIL = PAGINA.largura - PAGINA.margem.esquerda - PAGINA.margem.direita
export const X_ESQUERDA = PAGINA.margem.esquerda
export const X_DIREITA = PAGINA.largura - PAGINA.margem.direita

/** Faixa reservada ao rodapé de verificação, no pé de toda página. */
export const ALTURA_RODAPE = 34
/** Última coordenada utilizável antes de invadir o rodapé. */
export const LIMITE_CONTEUDO = PAGINA.altura - PAGINA.margem.base - ALTURA_RODAPE

/** Fio horizontal padrão das réguas e separadores. */
export function fio(
  doc: PDFKit.PDFDocument,
  y: number,
  opcoes: { de?: number; ate?: number; espessura?: number; cor?: string } = {},
): void {
  const { de = X_ESQUERDA, ate = X_DIREITA, espessura = 1, cor = CORES.fio } = opcoes
  doc.save()
  doc.moveTo(de, y).lineTo(ate, y).strokeColor(cor).lineWidth(espessura).stroke()
  doc.restore()
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const DIAS = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
]

/** "SEXTA-FEIRA, 18 DE SETEMBRO DE 2026" — a linha de data do Diário. */
export function dataPorExtenso(data: Date): string {
  const local = new Date(data.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  return `${DIAS[local.getDay()]}, ${local.getDate()} de ${MESES[local.getMonth()]} de ${local.getFullYear()}`
    .toUpperCase()
}

/** "18/09/2026 às 17:32" — carimbo de emissão no rodapé e no protocolo. */
export function dataHora(data: Date): string {
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).replace(', ', ' às ')
}
