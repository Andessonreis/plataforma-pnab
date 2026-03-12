/**
 * Helpers modulares de layout para documentos PDF (comprovante, declaração, resultados).
 * Todos os helpers operam sobre um PDFDocument já criado e posicionam o cursor.
 */
import type PDFDocument from 'pdfkit'
import { COLORS, MARGINS, CONTENT_WIDTH, PAGE_WIDTH } from './shared'

// ─── Constantes de layout compacto ──────────────────────────────────────────

const COL_LABEL_WIDTH = 150
const COL_VALUE_WIDTH = CONTENT_WIDTH - COL_LABEL_WIDTH
const ROW_HEIGHT = 16
const SECTION_GAP = 6

// ─── Header Compacto ─────────────────────────────────────────────────────────

/**
 * Header institucional compacto: faixa verde topo + título em 1 linha.
 * Ocupa ~50px verticais (vs ~90px do addHeader padrão).
 */
export function addCompactHeader(doc: PDFKit.PDFDocument, title: string): void {
  // Faixa verde topo
  doc.rect(0, 0, PAGE_WIDTH, 6).fill(COLORS.brand)

  const startY = MARGINS.top - 10

  // Logo / nome institucional + secretaria em 1 linha
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.brand)
    .text('PORTAL PNAB IRECÊ', MARGINS.left, startY, { continued: true })
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text('  —  Secretaria de Arte e Cultura de Irecê/BA', { align: 'left' })

  // Título do documento centralizado
  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(COLORS.text)
    .text(title, MARGINS.left, startY + 14, { width: CONTENT_WIDTH, align: 'center' })

  // Linha separadora fina
  const lineY = startY + 32
  doc
    .moveTo(MARGINS.left, lineY)
    .lineTo(PAGE_WIDTH - MARGINS.right, lineY)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke()

  doc.y = lineY + 8
}

// ─── Protocolo em faixa ──────────────────────────────────────────────────────

/**
 * Exibe o número de protocolo em uma faixa verde-claro de destaque.
 * Ocupa ~28px verticais.
 */
export function addProtocolBadge(doc: PDFKit.PDFDocument, numero: string): void {
  const y = doc.y
  const height = 26

  doc.rect(MARGINS.left, y, CONTENT_WIDTH, height).fill('#f0fdf4')

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLORS.brandDark)
    .text(`Protocolo: ${numero}`, MARGINS.left, y + 7, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.y = y + height + 6
}

// ─── Seção compacta ──────────────────────────────────────────────────────────

/**
 * Título de seção compacto com linha lateral (sem underline largo).
 * Ocupa ~18px verticais.
 */
export function addCompactSection(doc: PDFKit.PDFDocument, title: string): void {
  doc.y += SECTION_GAP

  const y = doc.y

  // Traço vertical colorido à esquerda
  doc.rect(MARGINS.left, y, 3, 12).fill(COLORS.brand)

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.brandDark)
    .text(title.toUpperCase(), MARGINS.left + 8, y + 1, { characterSpacing: 0.5 })

  doc.y = y + 14
}

// ─── Linha 2 colunas (label + valor) ─────────────────────────────────────────

/**
 * Renderiza um par label:valor em 2 colunas na mesma linha.
 * Usa layout 30% label / 70% valor.
 * @param striped Se true, adiciona fundo cinza leve (zebra).
 */
export function addTwoColumnRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  striped = false,
): void {
  const y = doc.y

  if (striped) {
    doc.rect(MARGINS.left, y - 1, CONTENT_WIDTH, ROW_HEIGHT + 2).fill('#f8fafc')
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.textLight)
    .text(label, MARGINS.left + 4, y, { width: COL_LABEL_WIDTH, ellipsis: true })

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.text)
    .text(value || '—', MARGINS.left + COL_LABEL_WIDTH + 4, y, {
      width: COL_VALUE_WIDTH - 8,
      ellipsis: true,
    })

  doc.y = y + ROW_HEIGHT
}

// ─── Bloco de informações (múltiplas linhas) ─────────────────────────────────

/**
 * Renderiza um array de pares label/valor em 2 colunas com fundo zebra.
 * Ideal para blocos de dados (Edital, Proponente).
 */
export function addInfoBlock(
  doc: PDFKit.PDFDocument,
  rows: Array<{ label: string; value: string }>,
): void {
  rows.forEach((row, i) => {
    addTwoColumnRow(doc, row.label, row.value, i % 2 === 0)
  })
  doc.y += 2
}

// ─── Divisor leve ────────────────────────────────────────────────────────────

/** Linha divisória horizontal fina entre seções. */
export function addDivider(doc: PDFKit.PDFDocument): void {
  doc.y += 3
  doc
    .moveTo(MARGINS.left, doc.y)
    .lineTo(PAGE_WIDTH - MARGINS.right, doc.y)
    .strokeColor(COLORS.border)
    .lineWidth(0.3)
    .stroke()
  doc.y += 4
}

// ─── Footer compacto ─────────────────────────────────────────────────────────

/**
 * Footer renderizado na posição absoluta com margem desativada.
 * A margem é zerada temporariamente para blindar contra auto-page-break.
 */
export function addCompactFooter(doc: PDFKit.PDFDocument, pageNumber: number): void {
  // O TRUQUE DE MESTRE: Salvar a margem atual e zerar a inferior
  const originalBottomMargin = doc.page.margins.bottom
  doc.page.margins.bottom = 0

  const lineY = 841.89 - 50 // 50 unidades do fundo (A4)

  doc
    .moveTo(MARGINS.left, lineY)
    .lineTo(PAGE_WIDTH - MARGINS.right, lineY)
    .strokeColor(COLORS.border)
    .lineWidth(0.3)
    .stroke()

  const footerY = lineY + 6

  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR')
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  // Left: Geração do documento
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(COLORS.textLight)
    .text(
      `Portal PNAB Irecê — Documento gerado em ${dateStr} às ${timeStr}`,
      MARGINS.left,
      footerY,
      { width: CONTENT_WIDTH, align: 'left', lineBreak: false },
    )

  // Right: Paginação
  doc.text(`Pág. ${pageNumber}`, MARGINS.left, footerY, {
    width: CONTENT_WIDTH,
    align: 'right',
    lineBreak: false,
  })

  // Retornar a margem ao normal após desenhar
  doc.page.margins.bottom = originalBottomMargin
}

// ─── Aviso legal compacto ────────────────────────────────────────────────────

/** Bloco de texto de aviso legal em fonte pequena. */
export function addLegalNotice(doc: PDFKit.PDFDocument, text: string): void {
  doc.y += 6
  doc.rect(MARGINS.left, doc.y, CONTENT_WIDTH, 1).fill(COLORS.border)
  doc.y += 5

  doc
    .font('Helvetica-Oblique')
    .fontSize(7.5)
    .fillColor(COLORS.textLight)
    .text(text, MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'justify' })
}
