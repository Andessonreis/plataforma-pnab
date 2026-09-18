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
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import {
  addInfoBlock,
  addDivider,
  addLegalNotice,
  addCompactSection,
} from './layout-helpers'
import {
  addTableEmptyRow,
  addTableHeader,
  addTableRow,
  calculateRowHeight,
  checkPageBreak,
  type ColumnDef,
} from './table-helpers'
import type { Emissao } from '@/lib/documentos/emissao'
import { criarDocumentoOficial, finalizarDocumento } from './documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from './documento-oficial/tema'

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
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
}

// ─── Colunas ─────────────────────────────────────────────────────────────────

// Somam LARGURA_UTIL (495,28pt) — a tabela ocupa a largura útil da página.
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
  const doc = await criarDocumentoOficial({
    rotulo: 'Recursos',
    titulo: 'Relatório de Recursos Interpostos',
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })
  const total = data.recursos.length

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

      checkPageBreak(doc, rowHeight + 2, COLUNAS)
      addTableRow(doc, COLUNAS, values, rowHeight)
    }
  }

  doc.y += 8
  checkPageBreak(doc, 30)
  doc.font(FONTES.rotulo).fontSize(9).fillColor(CORES.tinta)
    .text(`Total: ${total} recurso(s)`, X_ESQUERDA, doc.y, { width: LARGURA_UTIL })

  checkPageBreak(doc, 60)
  addCompactSection(doc, 'Conclusão')
  doc.font(FONTES.corpo).fontSize(9.5).fillColor(CORES.texto)
    .text(conclusao(data.etapa, data.prazo, total), X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'justify', lineGap: 2,
    })

  checkPageBreak(doc, 50)
  addLegalNotice(
    doc,
    'Documento oficial gerado pela plataforma Portal PNAB Irecê. Relaciona os recursos ' +
    'registrados no sistema na etapa e no prazo indicados acima, conforme os dados existentes ' +
    'na data e hora de geração.',
  )

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: 'Relatório de recursos interpostos' },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Etapa', valor: data.etapa },
    { rotulo: 'Prazo', valor: descreverPrazo(data.prazo) },
    { rotulo: 'Recursos', valor: String(total) },
  ])
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
