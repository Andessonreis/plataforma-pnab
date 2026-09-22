/**
 * Tabelas dos documentos oficiais, no desenho do Diário: grade de fio fino,
 * cabeçalho em trama cinza repetido a cada folha e altura de linha que
 * acompanha o conteúdo da célula mais alta.
 *
 * A grade fechada não é enfeite — em lista longa impressa é ela que mantém a
 * leitura na linha certa, e é o padrão das tabelas publicadas no Diário.
 */
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA, LIMITE_CONTEUDO } from './documento-oficial/tema'
import { novaPagina } from './documento-oficial/pagina'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ColumnDef {
  label: string
  width: number
  /** Alinhamento do dado na célula; o cabeçalho acompanha. Padrão: esquerda. */
  align?: 'left' | 'right' | 'center'
}

// ─── Constantes de layout ────────────────────────────────────────────────────

/** Última coordenada Y utilizável antes de invadir a faixa do rodapé. */
export const SAFE_BOTTOM = LIMITE_CONTEUDO

const ALTURA_MINIMA = 16
const ALTURA_CABECALHO = 18
const RESPIRO = 4
const FIO = 0.7
const CORPO = 7.5

// ─── Paginação ───────────────────────────────────────────────────────────────

/**
 * Fecha a folha e abre outra quando o bloco não cabe no espaço restante.
 * Passando `columns`, o cabeçalho da tabela é repetido no topo da nova página.
 */
export function checkPageBreak(
  doc: PDFKit.PDFDocument,
  requiredHeight: number,
  columns?: ColumnDef[],
): void {
  if (doc.y + requiredHeight <= SAFE_BOTTOM) return
  novaPagina(doc)
  if (columns) addTableHeader(doc, columns)
}

// ─── Grade ───────────────────────────────────────────────────────────────────

/** Fio de contorno e as divisórias verticais de uma faixa da tabela. */
function desenharGrade(doc: PDFKit.PDFDocument, columns: ColumnDef[], y: number, altura: number): void {
  doc.save()
  doc.lineWidth(FIO).strokeColor(CORES.fio)
  doc.rect(X_ESQUERDA, y, LARGURA_UTIL, altura).stroke()

  let x = X_ESQUERDA
  for (const col of columns.slice(0, -1)) {
    x += col.width
    doc.moveTo(x, y).lineTo(x, y + altura).stroke()
  }
  doc.restore()
}

/** Escreve os valores dentro das células de uma faixa já grafada. */
function escreverCelulas(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  valores: string[],
  y: number,
  fonte: string,
): void {
  let x = X_ESQUERDA
  for (let i = 0; i < columns.length; i++) {
    doc.font(fonte).fontSize(CORPO).fillColor(CORES.texto)
      .text(valores[i] ?? '—', x + RESPIRO, y, {
        width: columns[i].width - RESPIRO * 2,
        align: columns[i].align ?? 'left',
      })
    x += columns[i].width
  }
}

/**
 * Cabeçalho da tabela.
 *
 * A altura acompanha o rótulo mais alto: com muitas colunas, um título como
 * "Cadastrado em" quebra em duas linhas e precisa de faixa maior, senão o texto
 * vaza pra fora da trama.
 */
export function addTableHeader(doc: PDFKit.PDFDocument, columns: ColumnDef[]): void {
  const y = doc.y

  doc.font(FONTES.rotulo).fontSize(CORPO)
  const alturaTexto = columns.reduce(
    (maior, col) => Math.max(maior, doc.heightOfString(col.label, { width: col.width - RESPIRO * 2 })),
    0,
  )
  const altura = Math.max(ALTURA_CABECALHO, Math.ceil(alturaTexto) + RESPIRO * 2)

  doc.rect(X_ESQUERDA, y, LARGURA_UTIL, altura).fill(CORES.trama)
  desenharGrade(doc, columns, y, altura)
  escreverCelulas(doc, columns, columns.map((c) => c.label), y + RESPIRO + 1, FONTES.rotulo)

  doc.y = y + altura
}

/** Altura da linha, medida pelo conteúdo da célula mais alta. */
export function calculateRowHeight(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  values: string[],
): number {
  doc.font(FONTES.dado).fontSize(CORPO)
  const maior = columns.reduce(
    (max, col, i) => Math.max(max, doc.heightOfString(values[i] ?? '—', { width: col.width - RESPIRO * 2 })),
    10,
  )
  return Math.max(ALTURA_MINIMA, Math.ceil(maior) + RESPIRO * 2)
}

/** Linha de dados da tabela. */
export function addTableRow(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  values: string[],
  rowHeight: number,
): void {
  const y = doc.y
  desenharGrade(doc, columns, y, rowHeight)
  escreverCelulas(doc, columns, values, y + RESPIRO + 1, FONTES.dado)
  doc.y = y + rowHeight
}

/**
 * Linha única ocupando a largura da tabela, para quando não há registros.
 * A tabela vazia precisa aparecer no documento: é ela que comprova a ausência.
 */
export function addTableEmptyRow(doc: PDFKit.PDFDocument, texto: string): void {
  const y = doc.y
  const altura = 24

  desenharGrade(doc, [{ label: '', width: LARGURA_UTIL }], y, altura)
  doc.font(FONTES.corpoItalico).fontSize(8.5).fillColor(CORES.apoio)
    .text(texto, X_ESQUERDA + RESPIRO, y + 8, { width: LARGURA_UTIL - RESPIRO * 2, align: 'center' })

  doc.y = y + altura
}

/**
 * Corpo da tabela: mede cada linha, quebra a página quando ela não cabe e
 * repete o cabeçalho na folha nova. Sem registros, desenha a linha única de
 * `textoVazio`; sem `textoVazio`, não desenha nada.
 */
export function addTableRows(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  rows: string[][],
  textoVazio?: string,
): void {
  if (rows.length === 0) {
    if (textoVazio) addTableEmptyRow(doc, textoVazio)
    return
  }

  for (const values of rows) {
    const altura = calculateRowHeight(doc, columns, values)
    checkPageBreak(doc, altura + 2, columns)
    addTableRow(doc, columns, values, altura)
  }
}

/** Total em destaque ao pé da tabela. */
export function addTableTotal(doc: PDFKit.PDFDocument, texto: string): void {
  doc.y += 8
  checkPageBreak(doc, 30)
  doc.font(FONTES.rotulo).fontSize(9).fillColor(CORES.tinta)
    .text(texto, X_ESQUERDA, doc.y, { width: LARGURA_UTIL })
}
