import {
  modalidadesDaLinha, nomeDaCota, rotuloDeVagas, type ClassificacaoPorVaga, type GrupoDeVaga,
} from '@/lib/pdf/modelo/vagas-classificacao'
import type { CategoriaClassificacao, ListaClassificacaoData } from '@/lib/pdf/modelo/tipos'
import { fio } from '@/lib/pdf/documento-oficial/tema'
import { desenharSecao } from './blocos'
import { garantirEspaco } from './pagina'
import { desenharTabela } from './tabela'
import { colunasDaTabela, linhaDaTabela } from './tabela-classificacao'
import { COLORS, LARGURA_UTIL, MARGINS } from './tema'

/**
 * Categoria com cotas desenhada vaga a vaga: quadro de vagas em cartões, as
 * contempladas separadas por ampla concorrência e por cota, as suplentes com a
 * modalidade em que concorrem e, no fim, como ler a lista. A posição impressa é
 * sempre a da classificação geral por nota, para que a ordem continue conferível.
 */

const ALTURA_CARTAO = 40
const ESPACO_CARTAO = 6
const RECUO = 8

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function desenharCartao(
  doc: PDFKit.PDFDocument, x: number, y: number, largura: number,
  numero: number, rotulo: string, total: boolean,
): void {
  doc.rect(x, y, largura, ALTURA_CARTAO)
    .fillAndStroke(total ? COLORS.brand : COLORS.background, total ? COLORS.brand : COLORS.border)
  doc.font('Helvetica-Bold').fontSize(18).fillColor(total ? COLORS.white : COLORS.brandDark)
    .text(String(numero), x + RECUO, y + 5, { width: largura - RECUO * 2, lineBreak: false })
  doc.font(total ? 'Helvetica-Bold' : 'Helvetica').fontSize(7).fillColor(total ? COLORS.white : COLORS.text)
    .text(rotulo, x + RECUO, y + 25, { width: largura - RECUO * 2, height: 16, ellipsis: true })
}

function desenharQuadroDeVagas(doc: PDFKit.PDFDocument, categoria: CategoriaClassificacao): void {
  const cotas = categoria.cotas.filter((c) => c.vagas > 0)
  const ampla = categoria.vagasAmplaConcorrencia ?? 0
  const total = ampla + cotas.reduce((soma, c) => soma + c.vagas, 0)
  const cartoes = [
    {
      numero: total,
      rotulo: `${total === 1 ? 'vaga' : 'vagas'}${categoria.valorPorProjeto ? ` · ${brl(categoria.valorPorProjeto)} cada` : ' no total'}`,
      total: true,
    },
    { numero: ampla, rotulo: 'Ampla concorrência', total: false },
    ...cotas.map((c) => ({ numero: c.vagas, rotulo: `Cota — ${nomeDaCota(c.label)}`, total: false })),
  ]
  const largura = (LARGURA_UTIL - ESPACO_CARTAO * (cartoes.length - 1)) / cartoes.length
  const y = doc.y + 6
  cartoes.forEach((c, i) => desenharCartao(doc, MARGINS.left + i * (largura + ESPACO_CARTAO), y, largura, c.numero, c.rotulo, c.total))
  doc.y = y + ALTURA_CARTAO
}

function desenharTituloDoGrupo(doc: PDFKit.PDFDocument, grupo: GrupoDeVaga): void {
  garantirEspaco(doc, 60)
  doc.y += 4
  const y = doc.y
  const vagas = rotuloDeVagas(grupo)
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.text)
    .text(grupo.titulo, MARGINS.left, y, { width: LARGURA_UTIL - 150, lineBreak: false })
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.brandDark)
    .text(vagas, MARGINS.left + LARGURA_UTIL - 150, y + 1, { width: 150, align: 'right', lineBreak: false })
  fio(doc, y + 14, { espessura: 0.8, cor: COLORS.brand })
  doc.y = y + 18
}

function desenharObservacao(doc: PDFKit.PDFDocument, texto: string): void {
  const largura = LARGURA_UTIL - RECUO * 2
  doc.font('Helvetica-Oblique').fontSize(7.5)
  const altura = doc.heightOfString(`Observação: ${texto}`, { width: largura }) + 10
  garantirEspaco(doc, altura + 4)
  const y = doc.y + 3
  doc.rect(MARGINS.left, y, LARGURA_UTIL, altura).fill(COLORS.background)
  doc.fillColor(COLORS.text).font('Helvetica-Bold').text('Observação: ', MARGINS.left + RECUO, y + 5, { continued: true, width: largura })
    .font('Helvetica-Oblique').text(texto)
  doc.y = y + altura
}

function desenharComoLer(doc: PDFKit.PDFDocument): void {
  const itens = [
    'A posição (Pos.) é a da classificação geral da categoria, pela nota final.',
    'Quem optou por cota concorre também à ampla concorrência: se a nota alcança uma vaga de ampla, entra por ela, '
      + 'e a vaga da cota fica para o próximo optante. Por isso uma nota maior pode ficar como suplente enquanto '
      + 'outra, menor, é contemplada numa vaga de cota — só quem optou pela cota pode ocupá-la.',
    'Em caso de desistência ou impedimento, as suplentes são chamadas na ordem de classificação, respeitada a '
      + 'modalidade da vaga aberta.',
  ]
  // O bloco vai inteiro para a folha seguinte em vez de deixar metade das regras sozinha no pé da página.
  const opcoes = { width: LARGURA_UTIL - 8, align: 'justify' as const }
  doc.font('Helvetica').fontSize(7.8)
  const altura = itens.reduce((soma, item) => soma + doc.heightOfString(`•  ${item}`, opcoes) + 2, 26)
  garantirEspaco(doc, altura)
  desenharSecao(doc, 'Como ler este resultado')
  doc.font('Helvetica').fontSize(7.8).fillColor(COLORS.text)
  for (const item of itens) doc.text(`•  ${item}`, MARGINS.left + 4, doc.y + 2, opcoes)
}

export function desenharCategoriaPorVaga(
  doc: PDFKit.PDFDocument,
  categoria: CategoriaClassificacao,
  separada: ClassificacaoPorVaga,
  data: ListaClassificacaoData,
): void {
  desenharQuadroDeVagas(doc, categoria)

  desenharSecao(doc, 'Contemplados')
  const colunas = colunasDaTabela(data)
  for (const grupo of separada.contempladas) {
    desenharTituloDoGrupo(doc, grupo)
    // Vaga que foi para outra modalidade não tem ocupante aqui: a observação diz para onde foi.
    if (grupo.linhas.length > 0 || !grupo.observacao) {
      desenharTabela(doc, colunas, grupo.linhas.map((l) => linhaDaTabela(l, data)), { fios: true, vazio: 'Vaga não preenchida.' })
    }
    if (grupo.observacao) desenharObservacao(doc, grupo.observacao)
  }

  if (separada.suplentes.length > 0) {
    doc.y += 2
    garantirEspaco(doc, 70)
    desenharSecao(doc, 'Suplentes — em ordem de classificação')
    desenharTabela(
      doc, colunasDaTabela(data, 'CONCORRE POR'),
      separada.suplentes.map((l) => linhaDaTabela(l, data, modalidadesDaLinha(l, categoria.cotas))),
      { fios: true },
    )
  }

  if (separada.demais.length > 0) {
    doc.y += 2
    garantirEspaco(doc, 70)
    desenharSecao(doc, 'Não classificados')
    desenharTabela(doc, colunas, separada.demais.map((l) => linhaDaTabela(l, data)), { fios: true })
  }

  doc.y += 4
  desenharComoLer(doc)
}
