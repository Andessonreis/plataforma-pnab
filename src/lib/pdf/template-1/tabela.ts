import { COLORS, LARGURA_UTIL, MARGINS } from './tema'
import { garantirEspaco } from './pagina'

/**
 * Tabela paginada da versão 1: cabeçalho cinza repetido a cada folha, zebra,
 * altura de linha que acompanha o conteúdo e quebra que respeita o rodapé.
 *
 * `desenharTabela` é a única cópia do laço de linhas — cada gerador descreve as
 * colunas e entrega os valores já formatados. Antes o relatório final trazia a
 * sua própria cópia da tabela, e as duas foram divergindo.
 */

export interface ColunaTabela {
  label: string
  width: number
  /** Alinhamento do conteúdo e do rótulo; padrão é à esquerda. */
  align?: 'left' | 'right' | 'center'
  /** Coluna em negrito — posição e nota final, que são o que se lê primeiro. */
  negrito?: boolean
}

/** Aparência própria de uma célula, no lugar da padrão da coluna. */
export interface EstiloCelula {
  cor?: string
  negrito?: boolean
  sublinhado?: boolean
}

export interface LinhaTabela {
  valores: string[]
  /** Fundo próprio da linha, no lugar da zebra (ex.: destacar contempladas). */
  destaque?: string
  /** Estilo por célula, na ordem das colunas; célula sem entrada usa o padrão. */
  celulas?: (EstiloCelula | undefined)[]
}

export interface OpcoesTabela {
  /** Texto da linha única impressa quando não há registro; sem ele, nada é desenhado. */
  vazio?: string
  /** Separa as linhas por um fio fino em vez de zebrar. */
  fios?: boolean
}

const ALTURA_LINHA = 18
const ALTURA_CABECALHO = 20
const ALTURA_VAZIO = 26
const CORPO = 7.5
const RESPIRO_CELULA = 6

/**
 * Cabeçalho da tabela.
 *
 * A altura acompanha o rótulo mais alto: com muitas colunas selecionadas, um
 * título como "Cadastrado em" quebra em duas linhas e precisa de faixa maior,
 * senão o texto vaza pra fora do fundo cinza.
 */
function desenharCabecalhoTabela(doc: PDFKit.PDFDocument, colunas: ColunaTabela[]): void {
  const y = doc.y

  doc.font('Helvetica-Bold').fontSize(CORPO)
  const alturaTexto = colunas.reduce(
    (maior, col) => Math.max(maior, doc.heightOfString(col.label, { width: col.width - RESPIRO_CELULA })),
    0,
  )
  const altura = Math.max(ALTURA_CABECALHO, Math.ceil(alturaTexto) + 8)

  doc.rect(MARGINS.left, y, LARGURA_UTIL, altura).fill(COLORS.border)

  let x = MARGINS.left
  for (const col of colunas) {
    doc.font('Helvetica-Bold').fontSize(CORPO).fillColor(COLORS.text)
      .text(col.label, x + 3, y + 5, { width: col.width - RESPIRO_CELULA, align: col.align })
    x += col.width
  }

  doc.y = y + altura + 1
}

/** Altura que a linha precisa para caber a célula mais alta. */
export function calcularAlturaLinha(
  doc: PDFKit.PDFDocument,
  colunas: ColunaTabela[],
  valores: string[],
): number {
  doc.font('Helvetica').fontSize(CORPO)

  const alturaTexto = colunas.reduce((maior, col, i) => {
    const texto = valores[i] ?? '—'
    return Math.max(maior, doc.heightOfString(texto, { width: col.width - RESPIRO_CELULA }))
  }, 10)

  return Math.max(ALTURA_LINHA, Math.ceil(alturaTexto) + 8)
}

function desenharLinha(
  doc: PDFKit.PDFDocument,
  colunas: ColunaTabela[],
  linha: LinhaTabela,
  fundoPadrao: string | null,
  altura: number,
  fio: boolean,
): void {
  const y = doc.y
  const fundo = linha.destaque ?? fundoPadrao

  if (fundo) {
    doc.rect(MARGINS.left, y, LARGURA_UTIL, altura).fill(fundo)
  }

  let x = MARGINS.left
  colunas.forEach((col, i) => {
    const estilo = linha.celulas?.[i]
    const negrito = estilo?.negrito ?? col.negrito
    doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(CORPO).fillColor(estilo?.cor ?? COLORS.text)
      .text(linha.valores[i] ?? '—', x + 3, y + 4, {
        width: col.width - RESPIRO_CELULA, align: col.align, underline: estilo?.sublinhado,
      })
    x += col.width
  })

  if (fio) {
    doc.rect(MARGINS.left, y + altura - 0.3, LARGURA_UTIL, 0.3).fill(COLORS.border)
  }

  doc.y = y + altura
}

/**
 * Linha única ocupando a largura da tabela, para quando não há registros.
 * A tabela vazia precisa aparecer no documento: é ela que comprova a ausência.
 */
function desenharLinhaVazia(doc: PDFKit.PDFDocument, texto: string): void {
  const y = doc.y

  doc.rect(MARGINS.left, y, LARGURA_UTIL, ALTURA_VAZIO).fill(COLORS.background)

  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(COLORS.textLight)
    .text(texto, MARGINS.left + 3, y + 9, { width: LARGURA_UTIL - 6, align: 'center' })

  doc.y = y + ALTURA_VAZIO
}

/**
 * Desenha a tabela inteira a partir do cursor corrente.
 *
 * Quando a linha não cabe na folha, abre a página seguinte e repete o
 * cabeçalho — a folha solta continua se explicando.
 */
export function desenharTabela(
  doc: PDFKit.PDFDocument,
  colunas: ColunaTabela[],
  linhas: LinhaTabela[],
  opcoes: OpcoesTabela = {},
): void {
  // Cabeçalho sozinho no pé da folha não explica nada: quebra junto com a
  // primeira linha. Desenhar por cima da faixa do rodapé faria o PDFKit abrir
  // uma página no meio da tabela.
  garantirEspaco(doc, ALTURA_CABECALHO + ALTURA_LINHA)
  desenharCabecalhoTabela(doc, colunas)

  if (linhas.length === 0) {
    if (opcoes.vazio) desenharLinhaVazia(doc, opcoes.vazio)
    return
  }

  linhas.forEach((linha, i) => {
    const altura = calcularAlturaLinha(doc, colunas, linha.valores)
    if (garantirEspaco(doc, altura + 2)) desenharCabecalhoTabela(doc, colunas)
    const zebra = !opcoes.fios && i % 2 === 0
    desenharLinha(doc, colunas, linha, zebra ? COLORS.background : null, altura, opcoes.fios === true)
  })
}
