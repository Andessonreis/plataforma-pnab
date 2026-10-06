import { tituloDocumento } from '@/lib/documentos/titulos'
import { desenharMarcaDagua } from '@/lib/pdf/documento-oficial/marca-dagua'
import { AVISO_PREVIA, TEXTOS_POR_SITUACAO, descreverQuadroVagas } from '@/lib/pdf/modelo/lista-classificacao'
import type { CategoriaClassificacao, ListaClassificacaoData } from '@/lib/pdf/modelo/tipos'
import { separarPorVaga } from '@/lib/pdf/modelo/vagas-classificacao'
import { desenharAvisoDestaque, desenharAvisoLegal, desenharBlocoInfo, desenharDivisor } from './blocos'
import { desenharCabecalhoCompacto } from './cabecalho'
import { desenharCategoriaPorVaga, desenharObservacao } from './classificacao-por-vaga'
import { abrirDocumento, finalizarDocumento, garantirEspaco } from './pagina'
import { desenharTabela } from './tabela'
import { colunasDaTabela, descreverCriterios, linhaDaTabela, tetoDoBonus } from './tabela-classificacao'
import { COLORS, LARGURA_UTIL, MARGINS } from './tema'

/**
 * Classificação por categoria no layout da versão 1: tarja verde por categoria,
 * quadro de vagas, tabela com a bonificação aberta em colunas (B1, B2, B3...) e
 * as classificadas em destaque. É o desenho da lista preliminar já publicada.
 * Categoria com cotas sai separada por vaga (ver `classificacao-por-vaga`).
 */

const ALTURA_TARJA = 17
const ALTURA_QUADRO = 13
const ALTURA_LEGENDA = 11

function desenharTarja(doc: PDFKit.PDFDocument, nome: string): void {
  const y = doc.y
  doc.rect(MARGINS.left, y, LARGURA_UTIL, ALTURA_TARJA).fill(COLORS.brand)
  doc.font('Helvetica-Bold').fontSize(8.8).fillColor(COLORS.white)
    .text(nome, MARGINS.left + 7, y + 4.5, { width: LARGURA_UTIL - 14, lineBreak: false })
  doc.y = y + ALTURA_TARJA
}

function desenharQuadro(doc: PDFKit.PDFDocument, categoria: CategoriaClassificacao, legenda: string | null): void {
  let y = doc.y
  doc.rect(MARGINS.left, y, LARGURA_UTIL, ALTURA_QUADRO).fillAndStroke(COLORS.destaque, COLORS.destaqueBorda)
  doc.font('Helvetica-Bold').fontSize(6.8).fillColor(COLORS.sucesso)
    .text(descreverQuadroVagas(categoria), MARGINS.left + 7, y + 3.4, { width: LARGURA_UTIL - 14, lineBreak: false })
  y += ALTURA_QUADRO

  if (legenda) {
    doc.rect(MARGINS.left, y, LARGURA_UTIL, ALTURA_LEGENDA).fillAndStroke(COLORS.background, COLORS.border)
    doc.font('Helvetica').fontSize(6).fillColor(COLORS.textLight)
      .text(legenda, MARGINS.left + 7, y + 2.8, { width: LARGURA_UTIL - 14, lineBreak: false })
    y += ALTURA_LEGENDA
  }
  doc.y = y
}

export async function gerarListaClassificacaoV1(data: ListaClassificacaoData): Promise<Buffer> {
  const titulo = tituloDocumento({ tipo: 'CLASSIFICACAO', edital: data.edital, situacao: data.situacao })
  const previa = data.situacao === 'PREVIA'
  let primeiraFolha = true
  const doc = abrirDocumento({
    titulo: `${titulo} — ${data.edital.titulo}`,
    emissao: data.emissao,
    geradoEm: data.geradoEm,
    aoAbrirPagina: (folha) => {
      if (previa) desenharMarcaDagua(folha)
      desenharCabecalhoCompacto(folha, primeiraFolha ? titulo : `${titulo} (continuação)`)
      primeiraFolha = false
    },
  })

  if (previa) desenharAvisoDestaque(doc, AVISO_PREVIA)

  const bonus = data.mostraBonus ? data.bonus ?? null : null
  const total = data.categorias.reduce((soma, categoria) => soma + categoria.linhas.length, 0)
  desenharBlocoInfo(doc, [
    { label: 'Edital', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Total de Propostas', value: `${total} inscrições avaliadas` },
    ...(bonus ? [{
      label: 'Critérios de Bonificação',
      value: `${descreverCriterios(bonus, ':')} · Teto: ${tetoDoBonus(bonus)} pts`,
    }] : []),
  ])
  desenharDivisor(doc)

  const legenda = bonus ? `Bonificação: ${descreverCriterios(bonus, ' =')} · Limite máx.: ${tetoDoBonus(bonus)} pts` : null
  const colunas = colunasDaTabela(data)

  for (const categoria of data.categorias) {
    garantirEspaco(doc, ALTURA_TARJA + ALTURA_QUADRO + ALTURA_LEGENDA + 60)
    desenharTarja(doc, categoria.nome)
    const separada = separarPorVaga(categoria)
    if (separada) {
      desenharCategoriaPorVaga(doc, categoria, separada, data)
      doc.y += 10
      continue
    }
    desenharQuadro(doc, categoria, legenda)
    desenharTabela(doc, colunas, categoria.linhas.map((linha) => linhaDaTabela(linha, data)), { fios: true })
    doc.y += 10
  }

  if (data.errata) desenharObservacao(doc, data.errata, 'Errata')
  desenharAvisoLegal(doc, TEXTOS_POR_SITUACAO[data.situacao].rodape(data.mostraBonus))
  return finalizarDocumento(doc)
}
