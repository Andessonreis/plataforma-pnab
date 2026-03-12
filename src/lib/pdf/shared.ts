import PDFDocument from 'pdfkit'

// Cores institucionais
export const COLORS = {
  brand: '#059669',
  brandDark: '#047857',
  accent: '#d97706',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
  white: '#ffffff',
} as const

// Layout
export const MARGINS = { top: 60, bottom: 60, left: 50, right: 50 } as const
export const PAGE_WIDTH = 595.28 // A4
export const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right

/**
 * Cria um novo documento PDF com configurações padrão.
 */
export function createDocument(): PDFKit.PDFDocument {
  return new PDFDocument({
    size: 'A4',
    margins: MARGINS,
    info: {
      Title: 'Portal PNAB Irecê',
      Author: 'Secretaria de Arte e Cultura de Irecê',
      Creator: 'Portal PNAB Irecê',
    },
  })
}

/**
 * Adiciona o header institucional ao documento.
 */
export function addHeader(doc: PDFKit.PDFDocument, title: string): void {
  const y = MARGINS.top

  // Faixa verde no topo
  doc.rect(0, 0, PAGE_WIDTH, 8).fill(COLORS.brand)

  // Título institucional
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.brand)
    .text('PORTAL PNAB IRECÊ', MARGINS.left, y - 20, { align: 'left' })

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(COLORS.textLight)
    .text('Secretaria de Arte e Cultura de Irecê/BA', MARGINS.left, y - 8, { align: 'left' })

  // Linha separadora
  doc
    .moveTo(MARGINS.left, y + 8)
    .lineTo(PAGE_WIDTH - MARGINS.right, y + 8)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke()

  // Título do documento
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.text)
    .text(title, MARGINS.left, y + 20, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.moveDown(1.5)
}

/**
 * Adiciona o footer com número de página.
 */
export function addFooter(doc: PDFKit.PDFDocument, pageNumber: number): void {
  const y = doc.page.height - MARGINS.bottom - 20

  doc
    .moveTo(MARGINS.left, y)
    .lineTo(PAGE_WIDTH - MARGINS.right, y)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke()

  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(COLORS.textLight)
    .text(
      `Portal PNAB Irecê — Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      MARGINS.left,
      y + 8,
      { width: CONTENT_WIDTH, align: 'left' },
    )

  doc.text(`Página ${pageNumber}`, MARGINS.left, y + 8, {
    width: CONTENT_WIDTH,
    align: 'right',
  })
}

/**
 * Adiciona um par rótulo: valor.
 */
export function addField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x?: number,
): void {
  const posX = x ?? MARGINS.left

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.textLight)
    .text(`${label}:`, posX)

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(value, posX)

  doc.moveDown(0.3)
}

/**
 * Adiciona uma seção com título.
 */
export function addSection(doc: PDFKit.PDFDocument, title: string): void {
  doc.moveDown(0.8)

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLORS.brandDark)
    .text(title, MARGINS.left)

  doc
    .moveTo(MARGINS.left, doc.y + 2)
    .lineTo(MARGINS.left + 120, doc.y + 2)
    .strokeColor(COLORS.brand)
    .lineWidth(1)
    .stroke()

  doc.moveDown(0.5)
}

/**
 * Converte o documento PDF para Buffer.
 */
export function docToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}
