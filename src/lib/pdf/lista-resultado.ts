import { createDocument, addHeader, addFooter, addSection, docToBuffer, MARGINS, COLORS, CONTENT_WIDTH } from './shared'

interface ResultadoItem {
  posicao: number
  nome: string
  categoria?: string | null
  nota: number
  status: string
}

interface ListaResultadoData {
  edital: {
    titulo: string
    ano: number
  }
  fase: string // 'PRELIMINAR' | 'FINAL'
  resultados: ResultadoItem[]
  dataPublicacao: Date
}

/**
 * Gera PDF da lista de resultados de um edital.
 */
export async function generateListaResultado(data: ListaResultadoData): Promise<Buffer> {
  const doc = createDocument()
  let pageNum = 1

  const faseLabel = data.fase === 'FINAL' ? 'Resultado Final' : 'Resultado Preliminar'
  addHeader(doc, `${faseLabel} — ${data.edital.titulo}`)

  // Info do edital
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.textLight)
    .text(`Ano: ${data.edital.ano} | Publicado em: ${data.dataPublicacao.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, MARGINS.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  doc.moveDown(1)

  // Tabela de resultados
  addSection(doc, 'Classificação')

  const colWidths = [30, 140, 160, 50, 115.28]
  const headers = ['Pos.', 'Proponente', 'Categoria', 'Nota', 'Status']
  const tableTop = doc.y + 5
  let y = tableTop

  // Header da tabela
  doc.rect(MARGINS.left, y, CONTENT_WIDTH, 20).fill('#f1f5f9')
  headers.forEach((header, i) => {
    const x = MARGINS.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.text)
      .text(header, x + 4, y + 5, { width: colWidths[i] - 8 })
  })

  y += 22

  // Linhas da tabela
  for (const item of data.resultados) {
    const values = [
      String(item.posicao),
      maskName(item.nome),
      item.categoria ?? '—',
      item.nota.toFixed(2),
      formatStatus(item.status),
    ]

    doc.font('Helvetica').fontSize(8)
    let maxTextHeight = 10
    values.forEach((val, i) => {
      const th = doc.heightOfString(val, { width: colWidths[i] - 8 })
      if (th > maxTextHeight) maxTextHeight = th
    })
    const rowHeight = Math.max(18, Math.ceil(maxTextHeight) + 8)

    // Nova página se necessário
    if (y + rowHeight > doc.page.height - MARGINS.bottom - 30) {
      addFooter(doc, pageNum)
      pageNum++
      doc.addPage()
      y = MARGINS.top

      // Repete header
      doc.rect(MARGINS.left, y, CONTENT_WIDTH, 20).fill('#f1f5f9')
      headers.forEach((header, i) => {
        const x = MARGINS.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(COLORS.text)
          .text(header, x + 4, y + 5, { width: colWidths[i] - 8 })
      })
      y += 22
    }

    // Fundo alternado
    if (item.posicao % 2 === 0) {
      doc.rect(MARGINS.left, y, CONTENT_WIDTH, rowHeight).fill('#f8fafc')
    }

    values.forEach((val, i) => {
      const x = MARGINS.left + colWidths.slice(0, i).reduce((a, b) => a + b, 0)
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLORS.text)
        .text(val, x + 4, y + 4, { width: colWidths[i] - 8 })
    })

    y += rowHeight
  }

  // Total
  doc.moveDown(1)
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(`Total de inscrições classificadas: ${data.resultados.length}`, MARGINS.left)

  addFooter(doc, pageNum)

  return docToBuffer(doc)
}

/**
 * Mascara parcialmente o nome (LGPD).
 */
function maskName(name: string): string {
  const parts = name.split(' ')
  if (parts.length <= 1) return name
  return `${parts[0]} ${'*'.repeat(3)} ${parts[parts.length - 1]}`
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    CONTEMPLADA: 'Contemplado(a)',
    NAO_CONTEMPLADA: 'Não Contemplado(a)',
    SUPLENTE: 'Suplente',
    HABILITADA: 'Habilitado(a)',
    INABILITADA: 'Inabilitado(a)',
  }
  return map[status] ?? status
}
