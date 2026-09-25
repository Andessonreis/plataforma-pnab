import { tituloDocumento } from '@/lib/documentos/titulos'
import { desenharMarcaDagua } from '@/lib/pdf/documento-oficial/marca-dagua'
import {
  AVISO_PREVIA, SITUACAO_DA_LINHA, TEXTOS_POR_SITUACAO, descreverQuadroVagas, semNota,
} from '@/lib/pdf/modelo/lista-classificacao'
import type {
  CategoriaClassificacao, LinhaClassificacao, ListaClassificacaoData,
} from '@/lib/pdf/modelo/tipos'
import type { ItensBonusConfig } from '@/types/bonus-config'
import { desenharAvisoDestaque, desenharAvisoLegal, desenharBlocoInfo, desenharDivisor } from './blocos'
import { desenharCabecalhoCompacto } from './cabecalho'
import { abrirDocumento, finalizarDocumento, garantirEspaco } from './pagina'
import { desenharTabela, type ColunaTabela, type EstiloCelula, type LinhaTabela } from './tabela'
import { COLORS, LARGURA_UTIL, MARGINS } from './tema'

/**
 * Classificação por categoria no layout da versão 1: tarja verde por categoria,
 * quadro de vagas, tabela com a bonificação aberta em colunas (B1, B2, B3...) e
 * as classificadas em destaque. É o desenho da lista preliminar já publicada.
 */

const ALTURA_TARJA = 17
const ALTURA_QUADRO = 13
const ALTURA_LEGENDA = 11

/** Nome curto de cada item de bonificação nos títulos de coluna e na legenda. */
const ROTULO_CURTO_BONUS: Record<string, string> = {
  genero_lgbtqia: 'Gênero/LGBTQIA+',
  etnico_racial: 'Étnico-racial',
  pcd: 'PcD',
}

function rotuloDoItem(item: ItensBonusConfig['itens'][number]): string {
  return ROTULO_CURTO_BONUS[item.key] ?? item.label
}

/** Soma máxima da bonificação: os `maxItens` itens de maior pontuação. */
function tetoDoBonus(bonus: ItensBonusConfig): number {
  const pontos = bonus.itens.map((item) => item.pontos).sort((a, b) => b - a)
  const considerados = bonus.maxItens == null ? pontos : pontos.slice(0, bonus.maxItens)
  return considerados.reduce((soma, p) => soma + p, 0)
}

function descreverCriterios(bonus: ItensBonusConfig, ligacao: ':' | ' ='): string {
  const itens = bonus.itens.map((item, i) => `B${i + 1}${ligacao} ${rotuloDoItem(item)} (+${item.pontos})`)
  return itens.join(' · ')
}

/** Pontos de cada item de bonificação na linha, respeitando o teto de itens. */
function pontosPorItem(linha: LinhaClassificacao, bonus: ItensBonusConfig): number[] {
  const marcados = bonus.itens
    .filter((item) => linha.bonusItens?.includes(item.key))
    .sort((a, b) => b.pontos - a.pontos)
  const validos = new Set((bonus.maxItens == null ? marcados : marcados.slice(0, bonus.maxItens)).map((i) => i.key))
  return bonus.itens.map((item) => (validos.has(item.key) ? item.pontos : 0))
}

function colunasDaTabela(data: ListaClassificacaoData): ColunaTabela[] {
  const bonus = data.mostraBonus ? data.bonus ?? null : null
  const colunasBonus: ColunaTabela[] = bonus
    ? bonus.itens.map((_, i) => ({ label: `B${i + 1}`, width: 20, align: 'center' as const }))
    : data.mostraBonus ? [{ label: 'BÔNUS', width: 30, align: 'right' as const }] : []
  const media: ColunaTabela[] = data.mostraBonus ? [{ label: 'MÉDIA', width: 34, align: 'right' }] : []

  const fixas = 26 + 74 + 55 + 90.28 + media.reduce((s, c) => s + c.width, 0)
    + colunasBonus.reduce((s, c) => s + c.width, 0)
  return [
    { label: 'POS.', width: 26, align: 'center' },
    { label: 'INSCRIÇÃO', width: 74 },
    { label: 'PROPONENTE', width: LARGURA_UTIL - fixas },
    ...media,
    ...colunasBonus,
    { label: 'NOTA FINAL', width: 55, align: 'right' },
    { label: 'SITUAÇÃO', width: 90.28 },
  ]
}

function linhaDaTabela(linha: LinhaClassificacao, data: ListaClassificacaoData): LinhaTabela {
  const sem = semNota(linha)
  const classificada = linha.status === 'CONTEMPLADA'
  const bonus = data.mostraBonus ? data.bonus ?? null : null
  const destaque: EstiloCelula | undefined = classificada ? { cor: COLORS.sucesso, negrito: true } : undefined

  const valores = [sem ? '—' : `${linha.posicao}º`, linha.numero, linha.proponente]
  const celulas: (EstiloCelula | undefined)[] = [
    destaque, classificada ? { negrito: true } : undefined, classificada ? { negrito: true, sublinhado: true } : undefined,
  ]

  if (data.mostraBonus) {
    valores.push(sem ? '—' : linha.notaBase.toFixed(2))
    celulas.push(undefined)
    const pontos = bonus ? pontosPorItem(linha, bonus) : [linha.notaBonus]
    for (const p of pontos) {
      valores.push(sem ? '—' : String(p))
      celulas.push(p > 0 ? { cor: COLORS.brandDark, negrito: true } : { cor: COLORS.apagado })
    }
  }

  valores.push(sem ? '—' : linha.notaFinal.toFixed(2), SITUACAO_DA_LINHA[linha.status])
  celulas.push(destaque, destaque)

  return { valores, celulas, destaque: classificada ? COLORS.destaque : undefined }
}

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
    desenharQuadro(doc, categoria, legenda)
    desenharTabela(doc, colunas, categoria.linhas.map((linha) => linhaDaTabela(linha, data)), { fios: true })
    doc.y += 10
  }

  desenharAvisoLegal(doc, TEXTOS_POR_SITUACAO[data.situacao].rodape)
  return finalizarDocumento(doc)
}
