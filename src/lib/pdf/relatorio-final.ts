/**
 * Gerador de PDF do Relatório Final com timbre institucional.
 * Documento oficial com brasão, cabeçalho da Prefeitura/Secretaria,
 * tabelas de contemplados/suplentes/não contemplados e assinatura.
 */
import fs from 'fs'
import path from 'path'
import { createDocument, docToBuffer, MARGINS, CONTENT_WIDTH, COLORS, PAGE_WIDTH } from './shared'
import {
  addDivider,
  addLegalNotice,
  addCompactFooter,
  addCompactSection,
} from './layout-helpers'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface InscricaoItem {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  categoria: string | null
  notaFinal: number | null
}

export interface RelatorioFinalData {
  edital: { titulo: string; ano: number; slug: string; valorTotal: number | null }
  contemplados: InscricaoItem[]
  suplentes: InscricaoItem[]
  naoContemplados: InscricaoItem[]
  totalAvaliados: number
}

// ─── Constantes de layout ────────────────────────────────────────────────────

const PAGE_HEIGHT = 841.89 // A4
const FOOTER_ZONE = 60
const SAFE_BOTTOM = PAGE_HEIGHT - MARGINS.bottom - FOOTER_ZONE
const ROW_HEIGHT = 18
const HEADER_ROW_HEIGHT = 20

interface ColumnDef {
  label: string
  width: number
}

const COLUMNS: ColumnDef[] = [
  { label: 'Pos.', width: 32 },
  { label: 'Protocolo', width: 80 },
  { label: 'Nome', width: 148 },
  { label: 'CPF/CNPJ', width: 85 },
  { label: 'Categoria', width: 100 },
  { label: 'Nota', width: 50 },
]

// ─── Contexto de paginação ───────────────────────────────────────────────────

interface PageContext {
  pageNum: number
}

function checkPageBreak(doc: PDFKit.PDFDocument, requiredHeight: number, ctx: PageContext): void {
  if (doc.y + requiredHeight > SAFE_BOTTOM) {
    addCompactFooter(doc, ctx.pageNum)
    doc.addPage()
    ctx.pageNum++
    doc.y = MARGINS.top
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mascara CPF/CNPJ para exibição parcial. */
function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 6) return value
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`
}

/** Formata moeda BRL. */
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Meses em português por extenso. */
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** Data por extenso: "03 de abril de 2026". */
function dataPorExtenso(d: Date): string {
  return `${d.getDate().toString().padStart(2, '0')} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

// ─── Header com timbre ───────────────────────────────────────────────────────

function addTimbreHeader(doc: PDFKit.PDFDocument, data: RelatorioFinalData): void {
  // Faixa verde topo
  doc.rect(0, 0, PAGE_WIDTH, 8).fill(COLORS.brand)

  const startY = MARGINS.top - 15

  // Brasão (carregado do filesystem)
  const brasaoPath = path.join(process.cwd(), 'public/images/brasao-irece.png')
  let brasaoWidth = 0
  try {
    const brasaoData = fs.readFileSync(brasaoPath)
    const imgSize = 50
    doc.image(brasaoData, MARGINS.left, startY - 5, { width: imgSize, height: imgSize })
    brasaoWidth = imgSize + 10
  } catch {
    // Se o brasão não existir, segue sem imagem
    brasaoWidth = 0
  }

  const textX = MARGINS.left + brasaoWidth
  const textWidth = CONTENT_WIDTH - brasaoWidth

  // Prefeitura
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.text)
    .text('PREFEITURA MUNICIPAL DE IRECÊ', textX, startY, { width: textWidth, align: 'left' })

  // Secretaria
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.textLight)
    .text('Secretaria de Arte e Cultura', textX, doc.y + 1, { width: textWidth, align: 'left' })

  // PNAB + ano
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text(`Política Nacional Aldir Blanc — PNAB ${data.edital.ano}`, textX, doc.y + 1, { width: textWidth, align: 'left' })

  // Linha separadora
  const lineY = Math.max(doc.y + 6, startY + 52)
  doc
    .moveTo(MARGINS.left, lineY)
    .lineTo(PAGE_WIDTH - MARGINS.right, lineY)
    .strokeColor(COLORS.brand)
    .lineWidth(1)
    .stroke()
  doc
    .moveTo(MARGINS.left, lineY + 2)
    .lineTo(PAGE_WIDTH - MARGINS.right, lineY + 2)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke()

  doc.y = lineY + 14

  // Título do documento
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.brandDark)
    .text('RELATÓRIO FINAL DE RESULTADO', MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' })

  doc.y += 4

  // Subtítulo com dados do edital
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(`Edital PNAB Nº ${data.edital.ano} — ${data.edital.titulo}`, MARGINS.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.y += 12
}

// ─── Bloco de informações resumo ─────────────────────────────────────────────

function addInfoSummary(doc: PDFKit.PDFDocument, data: RelatorioFinalData): void {
  const now = new Date()
  const rows = [
    { label: 'Data de publicação', value: now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) },
    { label: 'Total de inscrições avaliadas', value: String(data.totalAvaliados) },
    {
      label: 'Contemplados / Suplentes / Não contemplados',
      value: `${data.contemplados.length}  |  ${data.suplentes.length}  |  ${data.naoContemplados.length}`,
    },
  ]

  if (data.edital.valorTotal) {
    rows.push({ label: 'Valor total do edital', value: formatCurrency(data.edital.valorTotal) })
  }

  // Fundo cinza claro
  const blockHeight = rows.length * 18 + 10
  doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, blockHeight).fill('#f0fdf4')

  const blockStartY = doc.y + 6
  for (let i = 0; i < rows.length; i++) {
    const rowY = blockStartY + i * 18
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(COLORS.textLight)
      .text(rows[i].label + ':', MARGINS.left + 10, rowY, { continued: true, width: 200 })
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(COLORS.text)
      .text('  ' + rows[i].value, { width: CONTENT_WIDTH - 220 })
  }

  doc.y = doc.y + blockHeight + 8
}

// ─── Tabela ──────────────────────────────────────────────────────────────────

function addTableHeader(doc: PDFKit.PDFDocument): void {
  const y = doc.y
  doc.rect(MARGINS.left, y, CONTENT_WIDTH, HEADER_ROW_HEIGHT).fill('#e2e8f0')

  let x = MARGINS.left
  for (const col of COLUMNS) {
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(COLORS.text)
      .text(col.label, x + 3, y + 5, { width: col.width - 6, ellipsis: true })
    x += col.width
  }
  doc.y = y + HEADER_ROW_HEIGHT + 1
}

function addTableRow(doc: PDFKit.PDFDocument, item: InscricaoItem, striped: boolean): void {
  const y = doc.y

  if (striped) {
    doc.rect(MARGINS.left, y, CONTENT_WIDTH, ROW_HEIGHT).fill('#f8fafc')
  }

  const values = [
    String(item.posicao),
    item.numero,
    item.nome,
    maskCpfCnpj(item.cpfCnpj),
    item.categoria ?? '—',
    item.notaFinal !== null ? Number(item.notaFinal).toFixed(2) : '—',
  ]

  let x = MARGINS.left
  for (let i = 0; i < COLUMNS.length; i++) {
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(COLORS.text)
      .text(values[i] ?? '—', x + 3, y + 4, {
        width: COLUMNS[i].width - 6,
        ellipsis: true,
        lineBreak: false,
      })
    x += COLUMNS[i].width
  }
  doc.y = y + ROW_HEIGHT
}

// ─── Seção de inscrições (contemplados, suplentes, etc.) ─────────────────────

function addInscricaoSection(
  doc: PDFKit.PDFDocument,
  title: string,
  items: InscricaoItem[],
  ctx: PageContext,
): void {
  if (items.length === 0) return

  checkPageBreak(doc, 60, ctx)
  addCompactSection(doc, `${title} (${items.length})`)
  addTableHeader(doc)

  for (let i = 0; i < items.length; i++) {
    checkPageBreak(doc, ROW_HEIGHT + 2, ctx)

    // Repete header da tabela após page break
    if (doc.y <= MARGINS.top + 2) {
      addTableHeader(doc)
    }

    addTableRow(doc, items[i], i % 2 === 0)
  }

  doc.y += 6
}

// ─── Assinatura ──────────────────────────────────────────────────────────────

function addSignatureBlock(doc: PDFKit.PDFDocument, ctx: PageContext): void {
  checkPageBreak(doc, 100, ctx)
  addDivider(doc)

  const now = new Date()

  doc.y += 10
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(`Irecê/BA, ${dataPorExtenso(now)}.`, MARGINS.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.y += 40

  // Linha de assinatura
  const lineStart = MARGINS.left + CONTENT_WIDTH * 0.25
  const lineEnd = MARGINS.left + CONTENT_WIDTH * 0.75
  doc
    .moveTo(lineStart, doc.y)
    .lineTo(lineEnd, doc.y)
    .strokeColor(COLORS.text)
    .lineWidth(0.5)
    .stroke()

  doc.y += 6
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text('Secretário(a) de Arte e Cultura', MARGINS.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text('Prefeitura Municipal de Irecê', MARGINS.left, doc.y + 2, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.y += 16
}

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateRelatorioFinal(data: RelatorioFinalData): Promise<Buffer> {
  const doc = createDocument()
  const ctx: PageContext = { pageNum: 1 }

  // ── Timbre (apenas página 1) ─────────────────────────────────────────
  addTimbreHeader(doc, data)

  // ── Bloco de informações ──────────────────────────────────────────────
  addInfoSummary(doc, data)
  addDivider(doc)

  // ── Seções de inscrições ──────────────────────────────────────────────
  addInscricaoSection(doc, 'Contemplados', data.contemplados, ctx)
  addInscricaoSection(doc, 'Suplentes', data.suplentes, ctx)
  addInscricaoSection(doc, 'Não Contemplados', data.naoContemplados, ctx)

  // ── Assinatura ───────────────────────────────────────────────────────
  addSignatureBlock(doc, ctx)

  // ── Aviso legal ─────────────────────────────────────────────────────
  checkPageBreak(doc, 50, ctx)
  addLegalNotice(
    doc,
    'Este documento constitui o relatório final oficial de resultado do edital acima identificado, ' +
    'gerado pela plataforma Portal PNAB Irecê. As informações apresentadas correspondem ao resultado ' +
    'definitivo após análise de recursos. Para fins de transparência e publicidade, conforme art. 37 ' +
    'da Constituição Federal e legislação da Política Nacional Aldir Blanc.',
  )

  // ── Footer da última página ─────────────────────────────────────────
  addCompactFooter(doc, ctx.pageNum)

  return docToBuffer(doc)
}
