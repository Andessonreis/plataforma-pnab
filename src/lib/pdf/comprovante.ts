import { createDocument, addHeader, addFooter, docToBuffer } from './shared'
import {
  addProtocolBadge,
  addCompactSection,
  addInlineField,
  addTwoColumnRow,
  addLegalNotice,
} from './layout-helpers'

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

const MAX_CAMPOS_RESUMO = 5

/**
 * Gera PDF de comprovante de inscrição — layout compacto (1 página).
 */
export async function generateComprovante(data: ComprovanteData): Promise<Buffer> {
  const doc = createDocument()

  addHeader(doc, 'Comprovante de Inscrição')
  addProtocolBadge(doc, data.numero)

  // Edital
  addCompactSection(doc, 'Edital')
  addInlineField(doc, 'Título', data.edital.titulo)
  addTwoColumnRow(
    doc,
    { label: 'Ano', value: String(data.edital.ano) },
    data.categoria ? { label: 'Categoria', value: data.categoria } : undefined,
  )

  // Proponente
  addCompactSection(doc, 'Proponente')
  addTwoColumnRow(
    doc,
    { label: 'Nome', value: data.proponente.nome },
    { label: 'Tipo', value: formatTipoProponente(data.proponente.tipoProponente) },
  )
  addTwoColumnRow(
    doc,
    { label: 'CPF/CNPJ', value: maskCpfCnpj(data.proponente.cpfCnpj) },
    { label: 'E-mail', value: data.proponente.email },
  )

  // Inscrição
  addCompactSection(doc, 'Inscrição')
  addInlineField(doc, 'Data de envio', formatDateTime(data.submittedAt))

  // Resumo de campos (top 5)
  const campos = extractCamposResumo(data.campos)
  if (campos.length > 0) {
    addCompactSection(doc, 'Resumo dos Campos')
    for (const { label, value } of campos) {
      addInlineField(doc, label, truncate(value, 80))
    }
    if (data.campos && Object.keys(data.campos).length > MAX_CAMPOS_RESUMO) {
      addInlineField(doc, 'Obs.', 'Campos completos disponíveis na plataforma.')
    }
  }

  addLegalNotice(
    doc,
    'Este documento é o comprovante oficial de inscrição no edital acima referido. ' +
    'Guarde este protocolo para acompanhamento. A inscrição será analisada conforme os critérios do edital.',
  )

  addFooter(doc, 1)

  return docToBuffer(doc)
}

function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  if (value.length <= 6) return value
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

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function extractCamposResumo(
  campos?: Record<string, unknown>,
): { label: string; value: string }[] {
  if (!campos) return []

  return Object.entries(campos)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, MAX_CAMPOS_RESUMO)
    .map(([key, v]) => ({
      label: key,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v),
    }))
}
