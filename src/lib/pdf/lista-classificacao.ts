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
import { desenharMarcaDagua } from './documento-oficial/marca-dagua'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from './documento-oficial/tema'
import { tituloDocumento } from '@/lib/documentos/titulos'
import type {
  CategoriaClassificacao, LinhaClassificacao, ListaClassificacaoData, SituacaoClassificacao,
} from './modelo/tipos'
import {
  AVISO_PREVIA, SITUACAO_DA_LINHA, TEXTOS_POR_SITUACAO, descreverQuadroVagas, semNota,
} from './modelo/lista-classificacao'

export type { CategoriaClassificacao, LinhaClassificacao, ListaClassificacaoData, SituacaoClassificacao }

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

/** Linha de vagas e valor, logo abaixo da tarja da categoria. */
function desenharQuadroVagas(doc: PDFKit.PDFDocument, categoria: CategoriaClassificacao): void {
  doc.font(FONTES.corpoItalico).fontSize(8).fillColor(CORES.apoio)
    .text(descreverQuadroVagas(categoria), X_ESQUERDA, doc.y, { width: LARGURA_UTIL, lineBreak: false })
  doc.y += 12
}

function valoresDaLinha(linha: LinhaClassificacao, data: ListaClassificacaoData): string[] {
  const { mostraBonus } = data
  const nome = linha.cotista ? `${linha.proponente} (cotista)` : linha.proponente
  const sem = semNota(linha)
  const posicao = sem ? '—' : `${linha.posicao}º`
  const notaFinal = sem ? '—' : linha.notaFinal.toFixed(2)
  const situacao = SITUACAO_DA_LINHA[linha.status]

  if (!mostraBonus) return [posicao, linha.numero, nome, notaFinal, situacao]

  return [
    posicao, linha.numero, nome,
    sem ? '—' : linha.notaBase.toFixed(2),
    linha.notaBonus > 0 ? `+${linha.notaBonus.toFixed(0)}` : '—',
    notaFinal, situacao,
  ]
}

export async function generateListaClassificacao(data: ListaClassificacaoData): Promise<Buffer> {
  const titulo = tituloDocumento({ tipo: 'CLASSIFICACAO', edital: data.edital, situacao: data.situacao })
  const { rodape, situacao } = TEXTOS_POR_SITUACAO[data.situacao]
  const doc = await criarDocumentoOficial({
    rotulo: 'Classificação',
    titulo,
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao,
    geradoEm: data.geradoEm,
    ...(data.situacao === 'PREVIA' ? { aviso: AVISO_PREVIA, marcaDagua: desenharMarcaDagua } : {}),
  })

  const colunas = data.mostraBonus ? COLUNAS_COM_BONUS : COLUNAS_SEM_BONUS

  for (const categoria of data.categorias) {
    garantirEspaco(doc, 80)
    tarjaSecao(doc, categoria.nome)
    desenharQuadroVagas(doc, categoria)
    addTableHeader(doc, colunas)

    for (const linha of categoria.linhas) {
      const valores = valoresDaLinha(linha, data)
      const altura = calculateRowHeight(doc, colunas, valores)
      checkPageBreak(doc, altura + 2, colunas)
      addTableRow(doc, colunas, valores, altura)
    }

    doc.y += 12
  }

  const totalPropostas = data.categorias.reduce((soma, categoria) => soma + categoria.linhas.length, 0)

  checkPageBreak(doc, 60)
  addLegalNotice(doc, rodape)

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: titulo },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Categorias', valor: String(data.categorias.length) },
    { rotulo: 'Propostas', valor: String(totalPropostas) },
    { rotulo: 'Bonificação', valor: data.mostraBonus ? 'Incluída na nota final' : 'Não exibida' },
    { rotulo: 'Situação', valor: situacao },
  ])
}
