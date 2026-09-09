/**
 * Relatório dos recursos interpostos numa etapa do edital.
 *
 * Documento de publicação: ao encerrar cada prazo recursal do cronograma, a
 * Secretaria precisa tornar público o que foi recebido — inclusive quando não
 * houve recurso algum, caso em que a tabela vazia é a própria prova.
 *
 * Segue o mesmo layout da relação de inscritos (mesmo header, mesma tabela)
 * para que as peças publicadas do edital tenham a mesma aparência.
 */
import { createDocument, docToBuffer, MARGINS, CONTENT_WIDTH, COLORS } from './shared'
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
  addTableEmptyRow,
  addTableHeader,
  addTableRow,
  calculateRowHeight,
  checkPageBreak,
  type ColumnDef,
  type PageContext,
} from './table-helpers'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface RelatorioRecursosItem {
  posicao: number
  /** Protocolo da inscrição a que o recurso se refere. */
  numero: string
  nome: string
  cpfCnpj: string
  protocoladoEm: Date
  /** Deferido, Indeferido ou Em análise. */
  situacao: string
}

export interface RelatorioRecursosData {
  edital: { titulo: string; ano: number }
  /** Etapa do cronograma a que o prazo recursal se refere. */
  etapa: string
  /** Janela de interposição prevista no cronograma; nula se o edital não fixa. */
  prazo: { inicio: Date; fim: Date } | null
  /** Universo considerado na etapa (ex.: inscrições enviadas). */
  totalInscricoes: number
  labelTotalInscricoes: string
  recursos: RelatorioRecursosItem[]
}

// ─── Colunas ─────────────────────────────────────────────────────────────────

// Somam CONTENT_WIDTH (495,28pt) — a tabela ocupa a largura útil da página.
const COLUNAS: ColumnDef[] = [
  { label: 'Nº', width: 24 },
  { label: 'Inscrição', width: 74 },
  { label: 'Proponente', width: 155 },
  { label: 'CPF/CNPJ', width: 68 },
  { label: 'Protocolado em', width: 84.28 },
  { label: 'Situação', width: 90 },
]

// ─── Formatação ──────────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo'

function formatData(data: Date): string {
  return data.toLocaleDateString('pt-BR', { timeZone: TZ })
}

function formatDataHora(data: Date): string {
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  return `${formatData(data)} ${hora}`
}

/** Data por extenso no corpo do texto: "08/09/2026, às 23h59". */
function formatDataPorExtenso(data: Date): string {
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
  return `${formatData(data)}, às ${hora.replace(':', 'h')}`
}

function descreverPrazo(prazo: RelatorioRecursosData['prazo']): string {
  if (!prazo) return 'não fixado no cronograma'
  return `${formatData(prazo.inicio)} a ${formatData(prazo.fim)}`
}

/** Encerrado só quando a janela do cronograma já passou. */
function descreverSituacaoPrazo(prazo: RelatorioRecursosData['prazo']): string {
  if (!prazo) return '—'
  return prazo.fim.getTime() < Date.now() ? 'Encerrado' : 'Em curso'
}

// ─── Geração do PDF ──────────────────────────────────────────────────────────

export async function generateRelatorioRecursos(data: RelatorioRecursosData): Promise<Buffer> {
  const doc = createDocument()
  const ctx: PageContext = { pageNum: 1 }
  const total = data.recursos.length

  addCompactHeader(doc, 'Relatório de Recursos Interpostos')

  addInfoBlock(doc, [
    { label: 'Edital', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Etapa', value: data.etapa },
    { label: 'Prazo para interposição', value: descreverPrazo(data.prazo) },
    { label: 'Situação do prazo', value: descreverSituacaoPrazo(data.prazo) },
    { label: data.labelTotalInscricoes, value: String(data.totalInscricoes) },
    { label: 'Recursos interpostos', value: String(total) },
  ])
  addDivider(doc)

  addCompactSection(doc, 'Recursos interpostos')
  addTableHeader(doc, COLUNAS)

  if (total === 0) {
    addTableEmptyRow(doc, 'Não consta recurso interposto no prazo.')
  } else {
    for (let i = 0; i < total; i++) {
      const values = buildRowValues(data.recursos[i])
      const rowHeight = calculateRowHeight(doc, COLUNAS, values)

      checkPageBreak(doc, rowHeight + 2, ctx, COLUNAS)
      addTableRow(doc, COLUNAS, values, i % 2 === 0, rowHeight)
    }
  }

  doc.y += 8
  checkPageBreak(doc, 30, ctx)
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(`Total: ${total} recurso(s)`, MARGINS.left)

  checkPageBreak(doc, 60, ctx)
  addCompactSection(doc, 'Conclusão')
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(conclusao(data.etapa, data.prazo, total), MARGINS.left, doc.y, {
      width: CONTENT_WIDTH,
      align: 'justify',
      lineGap: 2,
    })

  checkPageBreak(doc, 50, ctx)
  addLegalNotice(
    doc,
    'Documento oficial gerado pela plataforma Portal PNAB Irecê. Relaciona os recursos ' +
    'registrados no sistema na etapa e no prazo indicados acima, conforme os dados existentes ' +
    'na data e hora de geração.',
  )

  addCompactFooter(doc, ctx.pageNum)

  return docToBuffer(doc)
}

// ─── Helpers privados ────────────────────────────────────────────────────────

function conclusao(
  etapa: string,
  prazo: RelatorioRecursosData['prazo'],
  total: number,
): string {
  const janela = prazo
    ? ` — de ${formatData(prazo.inicio)} a ${formatDataPorExtenso(prazo.fim)} —`
    : ''

  if (total === 0) {
    return (
      `Encerrado o prazo recursal previsto no cronograma do edital para a etapa "${etapa}"${janela}, ` +
      'não consta recurso interposto nos registros da plataforma.'
    )
  }

  return (
    `No prazo recursal previsto no cronograma do edital para a etapa "${etapa}"${janela}, ` +
    `foram registrados ${total} recurso(s), relacionados acima.`
  )
}

function buildRowValues(item: RelatorioRecursosItem): string[] {
  return [
    String(item.posicao),
    item.numero,
    item.nome,
    maskCpfCnpjParcial(item.cpfCnpj),
    formatDataHora(item.protocoladoEm),
    item.situacao,
  ]
}
