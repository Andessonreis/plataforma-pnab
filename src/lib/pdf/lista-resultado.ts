/**
 * Resultado — preliminar ou final — de um edital.
 *
 * Peça de publicação: sai com o nome do proponente mascarado, no mesmo padrão
 * das listas já publicadas pela Secretaria.
 */
import { maskName } from '@/lib/utils/mask'
import {
  addTableHeader, addTableRow, calculateRowHeight, checkPageBreak, addTableEmptyRow,
  type ColumnDef,
} from './table-helpers'
import { addInfoBlock, addDivider, addCompactSection, addLegalNotice } from './layout-helpers'
import { criarDocumentoOficial, finalizarDocumento } from './documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from './documento-oficial/tema'
import type { Emissao } from '@/lib/documentos/emissao'

interface ResultadoItem {
  posicao: number
  nome: string
  categoria?: string | null
  nota: number
  status: string
}

interface ListaResultadoData {
  edital: { titulo: string; ano: number }
  /** 'PRELIMINAR' ou 'FINAL'. */
  fase: string
  resultados: ResultadoItem[]
  dataPublicacao: Date
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
}

const COLUNAS: ColumnDef[] = [
  { label: 'Pos.', width: 34, align: 'center' },
  { label: 'Proponente', width: 175 },
  { label: 'Categoria', width: 150 },
  { label: 'Nota', width: 50, align: 'right' },
  { label: 'Situação', width: 86.28 },
]

const SITUACAO: Record<string, string> = {
  CONTEMPLADA: 'Contemplado(a)',
  NAO_CONTEMPLADA: 'Não contemplado(a)',
  SUPLENTE: 'Suplente',
  HABILITADA: 'Habilitado(a)',
  INABILITADA: 'Inabilitado(a)',
}

export async function generateListaResultado(data: ListaResultadoData): Promise<Buffer> {
  const titulo = data.fase === 'FINAL' ? 'Resultado Final' : 'Resultado Preliminar'
  const doc = await criarDocumentoOficial({
    rotulo: 'Resultado',
    titulo,
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })

  addInfoBlock(doc, [
    { label: 'Edital', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Fase', value: titulo },
    {
      label: 'Publicado em',
      value: data.dataPublicacao.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    },
    { label: 'Classificados', value: String(data.resultados.length) },
  ])
  addDivider(doc)

  addCompactSection(doc, 'Classificação')
  addTableHeader(doc, COLUNAS)

  if (data.resultados.length === 0) {
    addTableEmptyRow(doc, 'Nenhuma proposta classificada nesta fase.')
  } else {
    for (const item of data.resultados) {
      const valores = [
        String(item.posicao),
        maskName(item.nome),
        item.categoria ?? '—',
        item.nota.toFixed(2),
        SITUACAO[item.status] ?? item.status,
      ]
      const altura = calculateRowHeight(doc, COLUNAS, valores)
      checkPageBreak(doc, altura + 2, COLUNAS)
      addTableRow(doc, COLUNAS, valores, altura)
    }
  }

  doc.y += 8
  checkPageBreak(doc, 30)
  doc.font(FONTES.rotulo).fontSize(9).fillColor(CORES.tinta)
    .text(`Total de propostas classificadas: ${data.resultados.length}`, X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL,
    })

  checkPageBreak(doc, 60)
  addLegalNotice(
    doc,
    'Lista oficial gerada pela plataforma Portal PNAB Irecê, com os dados registrados no sistema '
    + 'na data de geração. Os nomes são publicados de forma parcial, conforme a LGPD. '
    + 'Para contestações e recursos, consulte os prazos estabelecidos no edital.',
  )

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: titulo },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Classificados', valor: String(data.resultados.length) },
  ])
}
