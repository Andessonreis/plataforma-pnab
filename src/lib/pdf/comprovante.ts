import { createDocument, addHeader, addFooter, addField, addSection, docToBuffer, MARGINS, COLORS } from './shared'

interface ComprovanteData {
  numero: string
  proponente: {
    nome: string
    cpfCnpj: string
    email: string
    tipoProponente: string
  }
  edital: {
    titulo: string
    ano: number
  }
  categoria?: string | null
  submittedAt: Date
  campos?: Record<string, unknown>
}

/**
 * Gera PDF de comprovante de inscrição.
 */
export async function generateComprovante(data: ComprovanteData): Promise<Buffer> {
  const doc = createDocument()

  addHeader(doc, 'Comprovante de Inscrição')

  // Protocolo em destaque
  doc
    .rect(MARGINS.left, doc.y, 495.28, 40)
    .fill('#f0fdf4')

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(COLORS.brand)
    .text(`Protocolo: ${data.numero}`, MARGINS.left + 10, doc.y - 30, {
      width: 475,
      align: 'center',
    })

  doc.y += 20
  doc.moveDown(1)

  // Dados do Edital
  addSection(doc, 'Edital')
  addField(doc, 'Título', data.edital.titulo)
  addField(doc, 'Ano', String(data.edital.ano))
  if (data.categoria) {
    addField(doc, 'Categoria', data.categoria)
  }

  // Dados do Proponente
  addSection(doc, 'Proponente')
  addField(doc, 'Nome', data.proponente.nome)
  addField(doc, 'CPF/CNPJ', maskCpfCnpj(data.proponente.cpfCnpj))
  addField(doc, 'E-mail', data.proponente.email)
  addField(doc, 'Tipo', formatTipoProponente(data.proponente.tipoProponente))

  // Dados da Inscrição
  addSection(doc, 'Informações da Inscrição')
  addField(doc, 'Data de Envio', data.submittedAt.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }))

  // Resumo dos campos preenchidos
  if (data.campos && Object.keys(data.campos).length > 0) {
    addSection(doc, 'Resumo dos Campos')
    for (const [key, value] of Object.entries(data.campos)) {
      if (value !== null && value !== undefined && value !== '') {
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
        addField(doc, key, displayValue.length > 200 ? `${displayValue.slice(0, 200)}...` : displayValue)
      }
    }
  }

  // Aviso legal
  doc.moveDown(2)
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .text(
      'Este documento é o comprovante oficial de inscrição no edital acima referido. ' +
      'Guarde este protocolo para acompanhamento. A inscrição será analisada conforme critérios do edital.',
      MARGINS.left,
      doc.y,
      { width: 495.28, align: 'justify' },
    )

  addFooter(doc, 1)

  return docToBuffer(doc)
}

function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  if (value.length <= 6) return value
  // Mostra apenas últimos 4 dígitos
  return `***${value.slice(-4)}`
}

function formatTipoProponente(tipo: string): string {
  const map: Record<string, string> = {
    PF: 'Pessoa Física',
    PJ: 'Pessoa Jurídica',
    MEI: 'Microempreendedor Individual',
    COLETIVO: 'Coletivo Cultural',
  }
  return map[tipo] ?? tipo
}
