/**
 * Classificação por categoria de um edital.
 *
 * Cada categoria abre com a tarja da área e o quadro de vagas, e a tabela
 * fecha com a situação de cada proposta. Enquanto o resultado não é
 * consolidado o documento sai carimbado como prévia de trabalho: é peça
 * interna de conferência, não publicação.
 */
import {
  addTableHeader, addTableRow, calculateRowHeight, checkPageBreak, type ColumnDef,
} from './table-helpers'
import { addLegalNotice } from './layout-helpers'
import { criarDocumentoOficial, finalizarDocumento, garantirEspaco } from './documento-oficial'
import { tarjaSecao } from './documento-oficial/blocos'
import { CORES, FONTES, PAGINA, LARGURA_UTIL, X_ESQUERDA } from './documento-oficial/tema'
import type { Emissao } from '@/lib/documentos/emissao'

export interface LinhaClassificacao {
  posicao: number
  numero: string
  proponente: string
  notaBase: number
  notaBonus: number
  notaFinal: number
  cotista: boolean
  status: 'CONTEMPLADA' | 'SUPLENTE' | 'NAO_CONTEMPLADA'
  semAvaliacao: boolean
}

export interface CategoriaClassificacao {
  nome: string
  vagasAmplaConcorrencia: number | null
  cotas: { label: string; vagas: number }[]
  valorPorProjeto: number | null
  linhas: LinhaClassificacao[]
}

export interface ListaClassificacaoData {
  edital: { titulo: string; ano: number }
  categorias: CategoriaClassificacao[]
  /** Falso enquanto o resultado não foi consolidado — carimba a marca d'água. */
  consolidado: boolean
  mostraBonus: boolean
  geradoEm: Date
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao: Emissao | null
}

const SITUACAO: Record<LinhaClassificacao['status'], string> = {
  CONTEMPLADA: 'Contemplada',
  SUPLENTE: 'Suplente',
  NAO_CONTEMPLADA: 'Não contemplada',
}

const AVISO_PREVIA =
  'Documento de trabalho — não publicar. A conferência da bonificação e o lançamento de notas podem '
  + 'estar em andamento, portanto esta classificação pode mudar. Nenhum resultado foi consolidado no sistema.'

const COLUNAS_COM_BONUS: ColumnDef[] = [
  { label: 'Pos.', width: 30, align: 'center' },
  { label: 'Inscrição', width: 82 },
  { label: 'Proponente', width: 150 },
  { label: 'Média', width: 52, align: 'right' },
  { label: 'Bônus', width: 40, align: 'right' },
  { label: 'Nota final', width: 56, align: 'right' },
  { label: 'Situação', width: 85.28 },
]

const COLUNAS_SEM_BONUS: ColumnDef[] = [
  { label: 'Pos.', width: 34, align: 'center' },
  { label: 'Inscrição', width: 86 },
  { label: 'Proponente', width: 232 },
  { label: 'Nota final', width: 58, align: 'right' },
  { label: 'Situação', width: 85.28 },
]

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Marca d'água diagonal enquanto o resultado não foi consolidado. */
function desenharMarcaDagua(doc: PDFKit.PDFDocument): void {
  // `text` move o cursor: sem guardar a posição, o carimbo empurraria o
  // conteúdo da folha nova pra onde a diagonal terminou.
  const cursor = doc.y
  doc.save()
  doc.rotate(-24, { origin: [PAGINA.largura / 2, PAGINA.altura / 2] })
  doc.font(FONTES.titulo).fontSize(80).fillColor(CORES.tinta).opacity(0.06)
    .text('PRÉVIA', 0, PAGINA.altura / 2 - 40, { width: PAGINA.largura, align: 'center' })
  doc.opacity(1).restore()
  doc.y = cursor
}

/** Linha de vagas e valor, logo abaixo da tarja da categoria. */
function desenharQuadroVagas(doc: PDFKit.PDFDocument, categoria: CategoriaClassificacao): void {
  const cotas = categoria.cotas
    .filter((cota) => cota.vagas > 0)
    .map((cota) => `${cota.label}: ${cota.vagas}`)
    .join(' · ')

  const partes = [
    `${categoria.vagasAmplaConcorrencia ?? '—'} vaga(s) de ampla concorrência`,
    cotas || 'sem cota reservada',
    categoria.valorPorProjeto ? `${brl(categoria.valorPorProjeto)} por projeto` : null,
  ].filter(Boolean)

  doc.font(FONTES.corpoItalico).fontSize(8).fillColor(CORES.apoio)
    .text(partes.join(' · '), X_ESQUERDA, doc.y, { width: LARGURA_UTIL, lineBreak: false })
  doc.y += 12
}

function valoresDaLinha(linha: LinhaClassificacao, mostraBonus: boolean): string[] {
  const nome = linha.cotista ? `${linha.proponente} (cotista)` : linha.proponente
  const posicao = linha.semAvaliacao ? '—' : `${linha.posicao}º`
  const notaFinal = linha.semAvaliacao ? '—' : linha.notaFinal.toFixed(2)

  if (!mostraBonus) return [posicao, linha.numero, nome, notaFinal, SITUACAO[linha.status]]

  return [
    posicao, linha.numero, nome,
    linha.notaBase.toFixed(2),
    linha.notaBonus > 0 ? `+${linha.notaBonus.toFixed(0)}` : '—',
    notaFinal, SITUACAO[linha.status],
  ]
}

export async function generateListaClassificacao(data: ListaClassificacaoData): Promise<Buffer> {
  const titulo = data.consolidado ? 'Classificação por Categoria' : 'Classificação — Prévia de Trabalho'
  const doc = await criarDocumentoOficial({
    rotulo: 'Classificação',
    titulo,
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao,
    geradoEm: data.geradoEm,
    ...(data.consolidado ? {} : { aviso: AVISO_PREVIA, marcaDagua: desenharMarcaDagua }),
  })

  const colunas = data.mostraBonus ? COLUNAS_COM_BONUS : COLUNAS_SEM_BONUS

  for (const categoria of data.categorias) {
    garantirEspaco(doc, 80)
    tarjaSecao(doc, categoria.nome)
    desenharQuadroVagas(doc, categoria)
    addTableHeader(doc, colunas)

    for (const linha of categoria.linhas) {
      const valores = valoresDaLinha(linha, data.mostraBonus)
      const altura = calculateRowHeight(doc, colunas, valores)
      checkPageBreak(doc, altura + 2, colunas)
      addTableRow(doc, colunas, valores, altura)
    }

    doc.y += 12
  }

  const totalPropostas = data.categorias.reduce((soma, categoria) => soma + categoria.linhas.length, 0)

  checkPageBreak(doc, 60)
  addLegalNotice(
    doc,
    data.consolidado
      ? 'Classificação consolidada no sistema da plataforma Portal PNAB Irecê, conforme as notas '
        + 'lançadas pela comissão avaliadora e a bonificação prevista no edital.'
      : 'Prévia de conferência gerada pela plataforma Portal PNAB Irecê. Não constitui resultado '
        + 'e não deve ser publicada nem compartilhada fora da Secretaria.',
  )

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: titulo },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Categorias', valor: String(data.categorias.length) },
    { rotulo: 'Propostas', valor: String(totalPropostas) },
    { rotulo: 'Bonificação', valor: data.mostraBonus ? 'Incluída na nota final' : 'Não exibida' },
    { rotulo: 'Situação', valor: data.consolidado ? 'Resultado consolidado' : 'Prévia — não publicável' },
  ])
}
