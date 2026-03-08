import { createDocument, addHeader, addFooter, docToBuffer, MARGINS, COLORS, CONTENT_WIDTH } from './shared'

interface DeclaracaoData {
  proponente: {
    nome: string
    cpfCnpj: string
  }
  edital: {
    titulo: string
    ano: number
  }
  tipo: string
  dataEmissao: Date
}

/**
 * Gera PDF de declaração genérica.
 */
export async function generateDeclaracao(data: DeclaracaoData): Promise<Buffer> {
  const doc = createDocument()

  addHeader(doc, 'Declaração')

  doc.moveDown(2)

  // Corpo da declaração
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.text)
    .text(
      `Declaramos, para os devidos fins, que ${data.proponente.nome}, ` +
      `inscrito(a) sob o CPF/CNPJ ${maskCpfCnpj(data.proponente.cpfCnpj)}, ` +
      `encontra-se ${data.tipo === 'contemplado' ? 'contemplado(a)' : 'inscrito(a)'} ` +
      `no edital "${data.edital.titulo}" (${data.edital.ano}), ` +
      `promovido pela Secretaria de Arte e Cultura do Município de Irecê/BA, ` +
      `no âmbito da Política Nacional Aldir Blanc de Fomento à Cultura (PNAB).`,
      MARGINS.left,
      doc.y,
      { width: CONTENT_WIDTH, align: 'justify', lineGap: 4 },
    )

  doc.moveDown(2)

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.text)
    .text(
      `Esta declaração é válida para os fins a que se destina.`,
      MARGINS.left,
      doc.y,
      { width: CONTENT_WIDTH, align: 'justify' },
    )

  doc.moveDown(3)

  // Local e data
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLORS.text)
    .text(
      `Irecê/BA, ${data.dataEmissao.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
      MARGINS.left,
      doc.y,
      { width: CONTENT_WIDTH, align: 'right' },
    )

  doc.moveDown(4)

  // Linha de assinatura
  doc
    .moveTo(MARGINS.left + 100, doc.y)
    .lineTo(MARGINS.left + CONTENT_WIDTH - 100, doc.y)
    .strokeColor(COLORS.text)
    .lineWidth(0.5)
    .stroke()

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text('Secretaria de Arte e Cultura de Irecê', MARGINS.left, doc.y + 5, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  addFooter(doc, 1)

  return docToBuffer(doc)
}

function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  if (value.length <= 6) return value
  return `***${value.slice(-4)}`
}
