/**
 * Gerador de PDF de lista oficial de inscrições por status/fase.
 * Tabela paginada com header repetido, zebra striping, CPF mascarado.
 */
import { createDocument, docToBuffer, MARGINS, CONTENT_WIDTH, COLORS } from './shared'
import { formatTelefoneBR } from '@/lib/utils/format'
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import {
  addCompactHeader,
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactFooter,
  addCompactSection,
} from './layout-helpers'
import {
  addTableHeader,
  addTableRow,
  calculateRowHeight,
  checkPageBreak,
  type ColumnDef,
  type PageContext,
} from './table-helpers'

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
  categoria?: string | null
  status: string
  statusLabel: string
  tituloDocumento?: string
  inscricoes: ListaInscricoesItem[]
  total: number
  agruparPorCategoria?: boolean
}

// ─── Constantes de layout ────────────────────────────────────────────────────

/** Status que exibem nota final e posição de classificação. */
const STATUS_COM_NOTA = new Set(['CONTEMPLADA', 'NAO_CONTEMPLADA', 'SUPLENTE'])

/** Status que exibe motivo de inabilitação. */
const STATUS_COM_MOTIVO = new Set(['INABILITADA'])

// Lista de rascunhos é documento interno de contato — a Secretaria usa pra ligar
// pra quem começou a inscrição e não concluiu. Só ela leva telefone; as demais
// listas são oficiais e podem ser publicadas, então não expõem contato.
const STATUS_COM_TELEFONE = new Set(['RASCUNHO'])

function getColumns(status: string, hideCategoria = false): ColumnDef[] {
  if (hideCategoria) {
    if (STATUS_COM_NOTA.has(status)) {
      return [
        { label: 'Nº', width: 28 },
        { label: 'Protocolo', width: 80 },
        { label: 'Nome', width: 215 },
        { label: 'CPF/CNPJ', width: 85 },
        { label: 'Nota', width: 47 },
        { label: 'Pos.', width: 40 },
      ]
    }

    if (STATUS_COM_MOTIVO.has(status)) {
      return [
        { label: 'Nº', width: 28 },
        { label: 'Protocolo', width: 80 },
        { label: 'Nome', width: 175 },
        { label: 'CPF/CNPJ', width: 85 },
        { label: 'Motivo', width: 127 },
      ]
    }

    if (STATUS_COM_TELEFONE.has(status)) {
      return [
        { label: 'Nº', width: 28 },
        { label: 'Protocolo', width: 80 },
        { label: 'Nome', width: 210 },
        { label: 'CPF/CNPJ', width: 85 },
        { label: 'Telefone', width: 92.28 },
      ]
    }

    return [
      { label: 'Nº', width: 28 },
      { label: 'Protocolo', width: 80 },
      { label: 'Nome', width: 295 },
      { label: 'CPF/CNPJ', width: 92.28 },
    ]
  }

  const base: ColumnDef[] = [
    { label: 'Nº', width: 24 },
    { label: 'Protocolo', width: 74 },
    { label: 'Nome', width: 150 },
    { label: 'CPF/CNPJ', width: 68 },
    { label: 'Categoria', width: 80 },
  ]

  if (STATUS_COM_NOTA.has(status)) {
    // Ajustar larguras para caber nota e posição
    base[2].width = 120 // Nome
    base[4].width = 135 // Categoria
    return [
      ...base,
      { label: 'Nota', width: 42 },
      { label: 'Pos.', width: 36 },
    ]
  }

  if (STATUS_COM_MOTIVO.has(status)) {
    base[2].width = 115 // Nome
    base[4].width = 108 // Categoria
    return [
      ...base,
      { label: 'Motivo', width: 110 },
    ]
  }

  if (STATUS_COM_TELEFONE.has(status)) {
    base[2].width = 135 // Nome
    base[4].width = 122.28 // Categoria
    return [
      ...base,
      { label: 'Telefone', width: 74 },
    ]
  }

  // Colunas base — redistribuir espaço para Categoria
  const totalBase = base.reduce((acc, c) => acc + c.width, 0)
  const remaining = CONTENT_WIDTH - totalBase
  if (remaining > 0) {
    base[4].width += remaining // Categoria fica com espaço extra (179.28pt total)
  }

  return base
}

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateListaInscricoes(data: ListaInscricoesData): Promise<Buffer> {
  const doc = createDocument()
  const ctx: PageContext = { pageNum: 1 }

  // ── Header básico comum ──────────────────────────────────────────────────
  const tituloHeader =
    data.tituloDocumento ??
    (data.status === 'ENVIADA'
      ? 'Relação de Inscritos'
      : data.status === 'RASCUNHO'
        ? 'Relação de Inscrições em Rascunho'
        : `Relação de Inscrições — ${data.statusLabel}`)
  addCompactHeader(doc, tituloHeader)

  // ── Caso 1: Agrupado por área/categoria ─────────────────────────────────
  if (data.agruparPorCategoria) {
    const columns = getColumns(data.status, true)
    const groups = new Map<string, ListaInscricoesItem[]>()
    for (const item of data.inscricoes) {
      const cat = item.categoria || 'Sem Categoria Definida'
      const list = groups.get(cat) ?? []
      list.push(item)
      groups.set(cat, list)
    }

    const sortedCategories = Array.from(groups.keys()).sort()

    addInfoBlock(doc, [
      { label: 'Edital', value: data.edital.titulo },
      { label: 'Ano', value: String(data.edital.ano) },
      {
        label: 'Total geral',
        value: `${data.total} inscrição(ões) distribuídas em ${sortedCategories.length} áreas`,
      },
    ])
    addDivider(doc)

    // Se houver mais de uma categoria, exibe o quadro resumo
    if (sortedCategories.length > 1) {
      doc.y += 2
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(COLORS.brandDark)
        .text('DISTRIBUIÇÃO POR ÁREA / CATEGORIA', MARGINS.left)
      doc.y += 4

      const colSummaryWidth = CONTENT_WIDTH / 2 - 5
      const startSummaryY = doc.y

      for (let c = 0; c < sortedCategories.length; c++) {
        const cat = sortedCategories[c]
        const qtd = groups.get(cat)!.length
        const isRightCol = c >= Math.ceil(sortedCategories.length / 2)
        const colX = isRightCol ? MARGINS.left + colSummaryWidth + 10 : MARGINS.left
        const lineIndex = isRightCol ? c - Math.ceil(sortedCategories.length / 2) : c
        const itemY = startSummaryY + lineIndex * 12

        doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.text)
        doc.text(`• ${cat}:`, colX, itemY, { continued: true, width: colSummaryWidth - 25 })
        doc.font('Helvetica-Bold').text(` ${qtd}`)
      }

      const maxLines = Math.ceil(sortedCategories.length / 2)
      doc.y = startSummaryY + maxLines * 12 + 10
      addDivider(doc)
    }

    // Renderiza cada grupo de categoria
    for (const cat of sortedCategories) {
      const catItems = groups.get(cat)!
      checkPageBreak(doc, 50, ctx)

      addCompactSection(doc, `${cat} (${catItems.length})`)
      addTableHeader(doc, columns)

      for (let i = 0; i < catItems.length; i++) {
        const item = catItems[i]
        const values = buildRowValues({ ...item, posicao: i + 1 }, data.status, true)
        const rowHeight = calculateRowHeight(doc, columns, values)

        checkPageBreak(doc, rowHeight + 2, ctx, columns)
        addTableRow(doc, columns, values, i % 2 === 0, rowHeight)
      }

      doc.y += 10
    }

    checkPageBreak(doc, 60, ctx)
    doc.y += 6
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORS.brandDark)
      .text(`Total Geral do Edital: ${data.total} inscrição(ões)`, MARGINS.left)
    doc.y += 6
    addLegalNotice(doc, legalNoticeFor(data.status))
    addCompactFooter(doc, ctx.pageNum)
    return docToBuffer(doc)
  }

  // ── Caso 2: Lista de área/categoria individual ──────────────────────────
  if (data.categoria) {
    const columns = getColumns(data.status, true)

    addInfoBlock(doc, [
      { label: 'Edital', value: data.edital.titulo },
      { label: 'Área / Categoria', value: data.categoria },
      { label: 'Ano', value: String(data.edital.ano) },
      { label: 'Total na lista', value: `${data.total} inscrição(ões)` },
    ])
    addDivider(doc)

    addCompactSection(doc, `Inscrições — ${data.categoria}`)
    addTableHeader(doc, columns)

    for (let i = 0; i < data.inscricoes.length; i++) {
      const item = data.inscricoes[i]
      const values = buildRowValues(item, data.status, true)
      const rowHeight = calculateRowHeight(doc, columns, values)

      checkPageBreak(doc, rowHeight + 2, ctx, columns)
      addTableRow(doc, columns, values, i % 2 === 0, rowHeight)
    }

    doc.y += 8
    checkPageBreak(doc, 30, ctx)
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(`Total da Área: ${data.total} inscrição(ões)`, MARGINS.left)

    checkPageBreak(doc, 50, ctx)
    addLegalNotice(doc, legalNoticeFor(data.status))
    addCompactFooter(doc, ctx.pageNum)
    return docToBuffer(doc)
  }

  // ── Caso 3: Lista padrão única (tabela contínua com coluna Categoria) ─────
  const columns = getColumns(data.status, false)

  addInfoBlock(doc, [
    { label: 'Edital', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Total na lista', value: `${data.total} inscrição(ões)` },
  ])
  addDivider(doc)

  addCompactSection(doc, 'Inscrições')
  addTableHeader(doc, columns)

  for (let i = 0; i < data.inscricoes.length; i++) {
    const item = data.inscricoes[i]
    const values = buildRowValues(item, data.status, false)
    const rowHeight = calculateRowHeight(doc, columns, values)

    checkPageBreak(doc, rowHeight + 2, ctx, columns)
    addTableRow(doc, columns, values, i % 2 === 0, rowHeight)
  }

  doc.y += 8
  checkPageBreak(doc, 30, ctx)
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(`Total: ${data.total} inscrição(ões)`, MARGINS.left)

  checkPageBreak(doc, 50, ctx)
  addLegalNotice(doc, legalNoticeFor(data.status))
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
function buildRowValues(
  item: ListaInscricoesItem,
  status: string,
  hideCategoria = false,
): string[] {
  const base = hideCategoria
    ? [String(item.posicao), item.numero, item.nome, maskCpfCnpjParcial(item.cpfCnpj)]
    : [String(item.posicao), item.numero, item.nome, maskCpfCnpjParcial(item.cpfCnpj), item.categoria ?? '—']

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
