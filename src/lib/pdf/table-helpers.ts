/**
 * Tabela paginada dos documentos oficiais: header cinza repetido a cada página,
 * zebra striping, altura de linha adaptável ao conteúdo e quebra de página que
 * respeita a faixa do rodapé.
 *
 * Compartilhado pelos geradores que publicam listas (relação de inscritos,
 * relatório de recursos) para que todos saiam com a mesma cara.
 */
import type PDFDocument from 'pdfkit'
import { COLORS, MARGINS, CONTENT_WIDTH, PAGE_HEIGHT } from './shared'
import { addCompactFooter } from './layout-helpers'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ColumnDef {
  label: string
  width: number
}

/** Acompanha a numeração das páginas ao longo da geração. */
export interface PageContext {
  pageNum: number
}

// ─── Constantes de layout ────────────────────────────────────────────────────

const FOOTER_ZONE = 60
/** Última coordenada Y utilizável antes de invadir a faixa do rodapé. */
export const SAFE_BOTTOM = PAGE_HEIGHT - MARGINS.bottom - FOOTER_ZONE

const ROW_HEIGHT = 18
const HEADER_ROW_HEIGHT = 20

// ─── Paginação ───────────────────────────────────────────────────────────────

/**
 * Fecha a página e abre outra quando o bloco não cabe no espaço restante.
 * Passando `columns`, o header da tabela é repetido no topo da nova página.
 */
export function checkPageBreak(
  doc: PDFKit.PDFDocument,
  requiredHeight: number,
  ctx: PageContext,
  columns?: ColumnDef[],
): void {
  if (doc.y + requiredHeight > SAFE_BOTTOM) {
    addCompactFooter(doc, ctx.pageNum)
    doc.addPage()
    ctx.pageNum++
    doc.y = MARGINS.top
    if (columns) {
      addTableHeader(doc, columns)
    }
  }
}

// ─── Tabela ──────────────────────────────────────────────────────────────────

/**
 * Renderiza o header da tabela (fundo cinza).
 *
 * A altura acompanha o rótulo mais alto: com muitas colunas selecionadas, um
 * título como "Cadastrado em" quebra em duas linhas e precisa de faixa maior,
 * senão o texto vaza pra fora do fundo cinza.
 */
export function addTableHeader(doc: PDFKit.PDFDocument, columns: ColumnDef[]): void {
  const y = doc.y

  doc.font('Helvetica-Bold').fontSize(7.5)
  const alturaTexto = columns.reduce(
    (maior, col) => Math.max(maior, doc.heightOfString(col.label, { width: col.width - 6 })),
    0,
  )
  const altura = Math.max(HEADER_ROW_HEIGHT, Math.ceil(alturaTexto) + 8)

  doc.rect(MARGINS.left, y, CONTENT_WIDTH, altura).fill('#e2e8f0')

  let x = MARGINS.left
  for (const col of columns) {
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(COLORS.text)
      .text(col.label, x + 3, y + 5, { width: col.width - 6 })
    x += col.width
  }

  doc.y = y + altura + 1
}

/** Calcula a altura da linha com base no maior conteúdo de célula. */
export function calculateRowHeight(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  values: string[],
): number {
  doc.font('Helvetica').fontSize(7.5)
  let maxTextHeight = 10
  for (let i = 0; i < columns.length; i++) {
    const text = values[i] ?? '—'
    const h = doc.heightOfString(text, { width: columns[i].width - 6 })
    if (h > maxTextHeight) {
      maxTextHeight = h
    }
  }
  return Math.max(ROW_HEIGHT, Math.ceil(maxTextHeight) + 8)
}

/** Renderiza uma linha de dados da tabela com altura adaptável. */
export function addTableRow(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  values: string[],
  striped: boolean,
  rowHeight: number,
): void {
  const y = doc.y

  if (striped) {
    doc.rect(MARGINS.left, y, CONTENT_WIDTH, rowHeight).fill('#f8fafc')
  }

  let x = MARGINS.left
  for (let i = 0; i < columns.length; i++) {
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(COLORS.text)
      .text(values[i] ?? '—', x + 3, y + 4, {
        width: columns[i].width - 6,
      })
    x += columns[i].width
  }

  doc.y = y + rowHeight
}

/**
 * Linha única ocupando a largura da tabela, para quando não há registros.
 * A tabela vazia precisa aparecer no documento: é ela que comprova a ausência.
 */
export function addTableEmptyRow(doc: PDFKit.PDFDocument, texto: string): void {
  const y = doc.y
  const height = 26

  doc.rect(MARGINS.left, y, CONTENT_WIDTH, height).fill('#f8fafc')

  doc
    .font('Helvetica-Oblique')
    .fontSize(8.5)
    .fillColor(COLORS.textLight)
    .text(texto, MARGINS.left + 3, y + 9, { width: CONTENT_WIDTH - 6, align: 'center' })

  doc.y = y + height
}
