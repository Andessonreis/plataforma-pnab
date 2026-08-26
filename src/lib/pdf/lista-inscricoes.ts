/**
 * Gerador de PDF de lista oficial de inscrições por status/fase.
 * Tabela paginada com header repetido, zebra striping, CPF mascarado.
 */
import { createDocument, docToBuffer, MARGINS, CONTENT_WIDTH, COLORS, PAGE_WIDTH } from './shared'
import { formatTelefoneBR } from '@/lib/utils/format'
import {
  addCompactHeader,
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactFooter,
  addCompactSection,
} from './layout-helpers'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ListaInscricoesItem {
  posicao: number
  numero: string
  nome: string
  cpfCnpj: string
  categoria: string | null
  telefone: string | null
  notaFinal: number | null
  motivoInabilitacao: string | null
}

export interface ListaInscricoesData {
  edital: { titulo: string; ano: number }
  status: string
  statusLabel: string
  inscricoes: ListaInscricoesItem[]
  total: number
}

// ─── Constantes de layout ────────────────────────────────────────────────────

const PAGE_HEIGHT = 841.89 // A4
const FOOTER_ZONE = 60
const SAFE_BOTTOM = PAGE_HEIGHT - MARGINS.bottom - FOOTER_ZONE
const ROW_HEIGHT = 18
const HEADER_ROW_HEIGHT = 20

// Colunas adaptáveis por tipo de lista
interface ColumnDef {
  label: string
  width: number
}

/** Status que exibem nota final e posição de classificação. */
const STATUS_COM_NOTA = new Set(['CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'])

/** Status que exibe motivo de inabilitação. */
const STATUS_COM_MOTIVO = new Set(['INABILITADA'])

// Lista de rascunhos é documento interno de contato — a Secretaria usa pra ligar
// pra quem começou a inscrição e não concluiu. Só ela leva telefone; as demais
// listas são oficiais e podem ser publicadas, então não expõem contato.
const STATUS_COM_TELEFONE = new Set(['RASCUNHO'])

function getColumns(status: string): ColumnDef[] {
  const base: ColumnDef[] = [
    { label: 'Nº', width: 28 },
    { label: 'Protocolo', width: 80 },
    { label: 'Nome', width: 155 },
    { label: 'CPF/CNPJ', width: 85 },
    { label: 'Categoria', width: 80 },
  ]

  if (STATUS_COM_NOTA.has(status)) {
    // Ajustar larguras para caber nota e posição
    base[2].width = 120 // Nome mais curto
    base[4].width = 70  // Categoria mais curta
    return [
      ...base,
      { label: 'Nota', width: 45 },
      { label: 'Pos.', width: 38 },
    ]
  }

  if (STATUS_COM_MOTIVO.has(status)) {
    base[2].width = 120 // Nome mais curto
    base[4].width = 60  // Categoria mais curta
    return [
      ...base,
      { label: 'Motivo', width: 122 },
    ]
  }

  if (STATUS_COM_TELEFONE.has(status)) {
    base[2].width = 150 // Nome
    base[4].width = 65  // Categoria mais curta
    return [
      ...base,
      { label: 'Telefone', width: 87 },
    ]
  }

  // Colunas base — redistribuir espaço
  const totalBase = base.reduce((acc, c) => acc + c.width, 0)
  const remaining = CONTENT_WIDTH - totalBase
  if (remaining > 0) {
    base[2].width += remaining // Nome fica com espaço extra
  }

  return base
}

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

// ─── Helpers de tabela ───────────────────────────────────────────────────────

/** Mascara CPF/CNPJ para exibição parcial. */
function maskCpfCnpj(value: string): string {
  if (!value) return '—'
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 6) return value
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`
}

/** Renderiza o header da tabela (fundo cinza). */
function addTableHeader(doc: PDFKit.PDFDocument, columns: ColumnDef[]): void {
  const y = doc.y

  doc.rect(MARGINS.left, y, CONTENT_WIDTH, HEADER_ROW_HEIGHT).fill('#e2e8f0')

  let x = MARGINS.left
  for (const col of columns) {
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(COLORS.text)
      .text(col.label, x + 3, y + 5, { width: col.width - 6, ellipsis: true })
    x += col.width
  }

  doc.y = y + HEADER_ROW_HEIGHT + 1
}

/** Renderiza uma linha de dados da tabela. */
function addTableRow(
  doc: PDFKit.PDFDocument,
  columns: ColumnDef[],
  values: string[],
  striped: boolean,
): void {
  const y = doc.y

  if (striped) {
    doc.rect(MARGINS.left, y, CONTENT_WIDTH, ROW_HEIGHT).fill('#f8fafc')
  }

  let x = MARGINS.left
  for (let i = 0; i < columns.length; i++) {
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(COLORS.text)
      .text(values[i] ?? '—', x + 3, y + 4, {
        width: columns[i].width - 6,
        ellipsis: true,
        lineBreak: false,
      })
    x += columns[i].width
  }

  doc.y = y + ROW_HEIGHT
}

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateListaInscricoes(data: ListaInscricoesData): Promise<Buffer> {
  const doc = createDocument()
  const ctx: PageContext = { pageNum: 1 }
  const columns = getColumns(data.status)

  // ── Header ──────────────────────────────────────────────────────────────
  addCompactHeader(doc, `Lista de ${data.statusLabel}`)

  // ── Info do Edital ──────────────────────────────────────────────────────
  addInfoBlock(doc, [
    { label: 'Edital', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Total na lista', value: `${data.total} inscrição(ões)` },
  ])
  addDivider(doc)

  // ── Tabela ──────────────────────────────────────────────────────────────
  addCompactSection(doc, 'Inscrições')
  addTableHeader(doc, columns)

  for (let i = 0; i < data.inscricoes.length; i++) {
    // Verifica page break antes de cada linha
    checkPageBreak(doc, ROW_HEIGHT + 2, ctx)

    // Repete header da tabela após page break (se estamos no topo da página)
    if (doc.y <= MARGINS.top + 2) {
      addTableHeader(doc, columns)
    }

    const item = data.inscricoes[i]
    const values = buildRowValues(item, data.status)
    addTableRow(doc, columns, values, i % 2 === 0)
  }

  // ── Rodapé de contagem ────────────────────────────────────────────────
  doc.y += 8
  checkPageBreak(doc, 30, ctx)
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(`Total: ${data.total} inscrição(ões)`, MARGINS.left)

  // ── Aviso legal ───────────────────────────────────────────────────────
  checkPageBreak(doc, 50, ctx)
  addLegalNotice(doc, legalNoticeFor(data.status))

  // ── Footer da última página ───────────────────────────────────────────
  addCompactFooter(doc, ctx.pageNum)

  return docToBuffer(doc)
}

// ─── Helpers privados ────────────────────────────────────────────────────────

/**
 * Aviso de rodapé. Rascunho não é lista oficial nem publicável: são inscrições
 * inacabadas, e o documento leva telefone justamente pra equipe entrar em contato.
 */
function legalNoticeFor(status: string): string {
  if (STATUS_COM_TELEFONE.has(status)) {
    return (
      'Documento interno de trabalho gerado pela plataforma Portal PNAB Irecê. ' +
      'Relaciona inscrições iniciadas e ainda não enviadas na data de geração, com telefone ' +
      'para contato da equipe da Secretaria. Não constitui lista oficial e não deve ser ' +
      'publicado nem compartilhado fora da Secretaria — contém dados pessoais protegidos pela LGPD.'
    )
  }

  return (
    'Este documento é uma lista oficial gerada pela plataforma Portal PNAB Irecê. ' +
    'Os dados apresentados correspondem às informações registradas no sistema na data de geração. ' +
    'Para contestações e recursos, consulte os prazos estabelecidos no edital.'
  )
}

/** Monta os valores de uma linha de acordo com o status. */
function buildRowValues(item: ListaInscricoesItem, status: string): string[] {
  const base = [
    String(item.posicao),
    item.numero,
    item.nome,
    maskCpfCnpj(item.cpfCnpj),
    item.categoria ?? '—',
  ]

  if (STATUS_COM_NOTA.has(status)) {
    return [
      ...base,
      item.notaFinal !== null ? Number(item.notaFinal).toFixed(2) : '—',
      String(item.posicao),
    ]
  }

  if (STATUS_COM_MOTIVO.has(status)) {
    return [...base, item.motivoInabilitacao ?? '—']
  }

  if (STATUS_COM_TELEFONE.has(status)) {
    const tel = formatTelefoneBR(item.telefone ?? '')
    return [...base, tel || '—']
  }

  return base
}
