import { createDocument, docToBuffer } from './shared'
import {
  addCompactHeader,
  addProtocolBadge,
  addCompactSection,
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactFooter,
} from './layout-helpers'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ComprovanteData {
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

// Número máximo de campos do formulário exibidos no comprovante.
// Campos adicionais ficam disponíveis na plataforma.
const MAX_CAMPOS_EXIBIDOS = 6

// ─── Geração do comprovante ──────────────────────────────────────────────────

/**
 * Gera PDF de comprovante de inscrição em layout compacto (1 página A4).
 * Usa helpers modulares de layout-helpers.ts.
 */
export async function generateComprovante(data: ComprovanteData): Promise<Buffer> {
  const doc = createDocument()

  addCompactHeader(doc, 'Comprovante de Inscrição')
  addProtocolBadge(doc, data.numero)
  addDivider(doc)

  // ── Edital ────────────────────────────────────────────────────────────────
  addCompactSection(doc, 'Edital')
  addInfoBlock(doc, [
    { label: 'Título', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    ...(data.categoria ? [{ label: 'Categoria', value: data.categoria }] : []),
  ])
  addDivider(doc)

  // ── Proponente ────────────────────────────────────────────────────────────
  addCompactSection(doc, 'Proponente')
  addInfoBlock(doc, [
    { label: 'Nome', value: data.proponente.nome },
    { label: 'CPF/CNPJ', value: maskCpfCnpj(data.proponente.cpfCnpj) },
    { label: 'E-mail', value: data.proponente.email },
    { label: 'Tipo', value: formatTipoProponente(data.proponente.tipoProponente) },
  ])
  addDivider(doc)

  // ── Data de envio ─────────────────────────────────────────────────────────
  addCompactSection(doc, 'Inscrição')
  addInfoBlock(doc, [
    {
      label: 'Data de Envio',
      value: data.submittedAt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    { label: 'Protocolo', value: data.numero },
  ])

  // ── Resumo dos campos (max MAX_CAMPOS_EXIBIDOS) ───────────────────────────
  const camposRelevantes = buildCamposResumo(data.campos, MAX_CAMPOS_EXIBIDOS)
  if (camposRelevantes.length > 0) {
    addDivider(doc)
    addCompactSection(doc, 'Dados do Projeto (resumo)')
    addInfoBlock(doc, camposRelevantes)

    const total = Object.values(data.campos ?? {}).filter(
      (v) => v !== null && v !== undefined && v !== '',
    ).length
    if (total > MAX_CAMPOS_EXIBIDOS) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .fillColor('#64748b')
        .text(
          `* Exibindo ${MAX_CAMPOS_EXIBIDOS} de ${total} campos. Consulte os dados completos na plataforma.`,
          50,
          doc.y + 2,
        )
    }
  }

  // ── Aviso legal e footer ──────────────────────────────────────────────────
  addLegalNotice(
    doc,
    'Este documento é o comprovante oficial de inscrição no edital acima referido. ' +
    'Guarde este protocolo para acompanhamento e apresentação quando solicitado. ' +
    'A inscrição será analisada conforme os critérios estabelecidos no edital.',
  )
  addCompactFooter(doc, 1)

  return docToBuffer(doc)
}

// ─── Helpers privados ────────────────────────────────────────────────────────

function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 6) return value
  // Oculta dígitos do meio, mantém 3 primeiros e 2 últimos
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`
}

function formatTipoProponente(tipo: string): string {
  const map: Record<string, string> = {
    PF: 'Pessoa Física',
    PJ: 'Pessoa Jurídica',
    MEI: 'Microempreendedor Individual (MEI)',
    COLETIVO: 'Coletivo Cultural',
  }
  return map[tipo] ?? tipo
}

/**
 * Filtra e formata os campos do formulário para exibição resumida no comprovante.
 * Exclui campos vazios e limita ao máximo definido.
 */
function buildCamposResumo(
  campos: Record<string, unknown> | undefined,
  max: number,
): Array<{ label: string; value: string }> {
  if (!campos) return []

  return Object.entries(campos)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, max)
    .map(([key, value]) => {
      const rawStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
      // Truncar valores muito longos para não quebrar layout
      const truncated = rawStr.length > 80 ? `${rawStr.slice(0, 77)}...` : rawStr
      // Converter camelCase/snake_case para label legível
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim()
      return { label, value: truncated }
    })
}
