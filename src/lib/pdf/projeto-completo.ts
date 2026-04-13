/**
 * Gerador de PDF completo do projeto — todas as seções, multi-página.
 * Reutiliza helpers modulares de shared.ts e layout-helpers.ts.
 */
import { createDocument, docToBuffer, MARGINS, CONTENT_WIDTH, COLORS, PAGE_WIDTH } from './shared'
import {
  addCompactHeader,
  addProtocolBadge,
  addCompactSection,
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactFooter,
  addTwoColumnRow,
} from './layout-helpers'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ProjetoCompletoData {
  numero: string
  status: string
  proponente: {
    nome: string
    cpfCnpj: string
    email: string
    tipoProponente: string
  }
  edital: { titulo: string; ano: number }
  categoria?: string | null
  campos: Record<string, unknown>
  camposFormulario: Array<{ nome: string; label: string; tipo: string }>
  anexos: Array<{ titulo: string; tipo: string; valido?: boolean | null }>
  submittedAt: Date
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const PAGE_HEIGHT = 841.89 // A4
const FOOTER_ZONE = 60 // espaço reservado para footer
const SAFE_BOTTOM = PAGE_HEIGHT - MARGINS.bottom - FOOTER_ZONE

// ─── Contexto de paginação ───────────────────────────────────────────────────

interface PageContext {
  pageNum: number
}

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Verifica se há espaço; se não houver, faz page break. */
function checkPageBreak(doc: PDFKit.PDFDocument, requiredHeight: number, ctx: PageContext): void {
  if (doc.y + requiredHeight > SAFE_BOTTOM) {
    addCompactFooter(doc, ctx.pageNum)
    doc.addPage()
    ctx.pageNum++
    doc.y = MARGINS.top
  }
}

/** Resolve o label de um campo: busca em camposFormulario, fallback para camelCase→legível. */
function resolveCampoLabel(
  key: string,
  camposFormulario: Array<{ nome: string; label: string }>,
): string {
  const def = camposFormulario.find((cf) => cf.nome === key)
  if (def) return def.label
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

/** Resolve o tipo de um campo a partir de camposFormulario. */
function resolveCampoTipo(
  key: string,
  camposFormulario: Array<{ nome: string; tipo: string }>,
): string {
  const def = camposFormulario.find((cf) => cf.nome === key)
  return def?.tipo ?? 'texto'
}

/** Mascara CPF/CNPJ para exibição. */
function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 6) return value
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`
}

/** Formata tipo de proponente. */
function formatTipoProponente(tipo: string): string {
  const map: Record<string, string> = {
    PF: 'Pessoa Física',
    PJ: 'Pessoa Jurídica',
    MEI: 'Microempreendedor Individual (MEI)',
    COLETIVO: 'Coletivo Cultural',
  }
  return map[tipo] ?? tipo
}

/** Formata valor como moeda BRL. */
function formatCurrency(value: unknown): string {
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Formata data no padrão DD/MM/YYYY. */
function formatDate(value: unknown): string {
  const date = new Date(String(value))
  if (isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

/** Formata valor de campo conforme o tipo e o nome. */
function formatCampoValue(value: unknown, tipo: string, key: string): string {
  if (value === null || value === undefined || value === '') return '—'
  if (tipo === 'moeda') return formatCurrency(value)
  // Fallback: campo com "valor" no nome e valor numérico → formata como moeda
  if (key.toLowerCase().includes('valor') && !isNaN(Number(value))) return formatCurrency(value)
  if (tipo === 'data') return formatDate(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Status legíveis para anexos. */
function formatAnexoStatus(valido: boolean | null | undefined): string {
  if (valido === true) return 'Válido'
  if (valido === false) return 'Inválido'
  return 'Pendente'
}

/** Status legíveis para inscrição. */
const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADA: 'Enviada',
  HABILITADA: 'Habilitada',
  INABILITADA: 'Inabilitada',
  EM_AVALIACAO: 'Em Avaliação',
  RESULTADO_PRELIMINAR: 'Resultado Preliminar',
  RECURSO_ABERTO: 'Recurso Aberto',
  RESULTADO_FINAL: 'Resultado Final',
  CONTEMPLADA: 'Contemplada',
  NAO_CONTEMPLADA: 'Não Contemplada',
  SUPLENTE: 'Suplente',
}

/**
 * Renderiza um campo de texto longo (textarea) com word wrap completo,
 * fazendo page break automático quando necessário.
 */
function addLongTextField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  ctx: PageContext,
  striped: boolean,
): void {
  const labelHeight = 14
  const textWidth = CONTENT_WIDTH - 8

  // Pré-calcular altura do texto
  doc.font('Helvetica').fontSize(8.5)
  const textHeight = doc.heightOfString(value || '—', { width: textWidth })
  const totalHeight = labelHeight + textHeight + 6

  checkPageBreak(doc, totalHeight, ctx)

  const y = doc.y

  // Fundo zebra (se necessário)
  if (striped) {
    doc.rect(MARGINS.left, y - 1, CONTENT_WIDTH, totalHeight + 2).fill('#f8fafc')
  }

  // Label
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.textLight)
    .text(label, MARGINS.left + 4, y, { width: CONTENT_WIDTH - 8 })

  // Valor com word wrap
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLORS.text)
    .text(value || '—', MARGINS.left + 4, doc.y + 2, { width: textWidth })

  doc.y += 4
}

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateProjetoCompleto(data: ProjetoCompletoData): Promise<Buffer> {
  const doc = createDocument()
  const ctx: PageContext = { pageNum: 1 }

  // ── Header ──────────────────────────────────────────────────────────────
  addCompactHeader(doc, 'Projeto Completo')
  addProtocolBadge(doc, data.numero)
  addDivider(doc)

  // ── Edital ──────────────────────────────────────────────────────────────
  checkPageBreak(doc, 80, ctx)
  addCompactSection(doc, 'Edital')
  addInfoBlock(doc, [
    { label: 'Título', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    ...(data.categoria ? [{ label: 'Categoria', value: data.categoria }] : []),
    { label: 'Status da Inscrição', value: STATUS_LABELS[data.status] ?? data.status },
  ])
  addDivider(doc)

  // ── Proponente ──────────────────────────────────────────────────────────
  checkPageBreak(doc, 80, ctx)
  addCompactSection(doc, 'Proponente')
  addInfoBlock(doc, [
    { label: 'Nome', value: data.proponente.nome },
    { label: 'CPF/CNPJ', value: maskCpfCnpj(data.proponente.cpfCnpj) },
    { label: 'E-mail', value: data.proponente.email },
    { label: 'Tipo', value: formatTipoProponente(data.proponente.tipoProponente) },
  ])
  addDivider(doc)

  // ── Dados do Projeto ────────────────────────────────────────────────────
  const campoKeys = buildCampoKeys(data.campos, data.camposFormulario)
  if (campoKeys.length > 0) {
    checkPageBreak(doc, 30, ctx)
    addCompactSection(doc, 'Dados do Projeto')

    campoKeys.forEach((key, i) => {
      const label = resolveCampoLabel(key, data.camposFormulario)
      const tipo = resolveCampoTipo(key, data.camposFormulario)
      const value = data.campos[key]
      const formatted = formatCampoValue(value, tipo, key)
      const striped = i % 2 === 0

      if (tipo === 'textarea' && formatted.length > 100) {
        addLongTextField(doc, label, formatted, ctx, striped)
      } else {
        checkPageBreak(doc, 20, ctx)
        addTwoColumnRow(doc, label, formatted, striped)
      }
    })

    addDivider(doc)
  }

  // ── Anexos ──────────────────────────────────────────────────────────────
  if (data.anexos.length > 0) {
    checkPageBreak(doc, 30 + data.anexos.length * 18, ctx)
    addCompactSection(doc, 'Anexos')
    addInfoBlock(
      doc,
      data.anexos.map((a) => ({
        label: a.titulo,
        value: `${a.tipo} — ${formatAnexoStatus(a.valido)}`,
      })),
    )
    addDivider(doc)
  }

  // ── Inscrição ───────────────────────────────────────────────────────────
  checkPageBreak(doc, 50, ctx)
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
        timeZone: 'America/Sao_Paulo',
      }),
    },
    { label: 'Protocolo', value: data.numero },
  ])

  // ── Aviso legal ─────────────────────────────────────────────────────────
  checkPageBreak(doc, 40, ctx)
  addLegalNotice(
    doc,
    'Este documento é uma cópia para referência do projeto inscrito no edital acima referido. ' +
    'Os dados apresentados correspondem às informações registradas na plataforma no momento da inscrição. ' +
    'Para fins oficiais, consulte a plataforma do Portal PNAB Irecê.',
  )

  // ── Footer da última página ─────────────────────────────────────────────
  addCompactFooter(doc, ctx.pageNum)

  return docToBuffer(doc)
}

// ─── Helpers privados ────────────────────────────────────────────────────────

/**
 * Monta a lista ordenada de chaves de campos a exibir.
 * Prioriza a ordem definida em camposFormulario, depois campos órfãos.
 */
function buildCampoKeys(
  campos: Record<string, unknown>,
  camposFormulario: Array<{ nome: string }>,
): string[] {
  const allKeys = Object.keys(campos).filter(
    (k) => campos[k] !== null && campos[k] !== undefined && campos[k] !== '',
  )

  // Ordem definida pelo formulário
  const ordered = camposFormulario
    .map((cf) => cf.nome)
    .filter((nome) => allKeys.includes(nome))

  // Campos órfãos (preenchidos mas não no formulário)
  const orphans = allKeys.filter((k) => !ordered.includes(k))

  return [...ordered, ...orphans]
}
