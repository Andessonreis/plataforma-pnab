/**
 * Blocos de conteúdo dos documentos oficiais: ficha de dados, seção, aviso
 * legal e protocolo em destaque. Todos operam sobre um documento já aberto por
 * `criarDocumentoOficial` e posicionam o cursor para o bloco seguinte.
 */
import { caixaRotulada, tarjaSecao, separador } from './documento-oficial/blocos'
import { desenharRodape } from './documento-oficial/rodape'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA, fio } from './documento-oficial/tema'

// ─── Constantes de layout ────────────────────────────────────────────────────

const COL_ROTULO = 140
const RESPIRO = 5
const CORPO = 8.5

// ─── Ficha de dados ──────────────────────────────────────────────────────────

export interface LinhaFicha {
  label: string
  value: string
}

/** Altura que a linha precisa para caber o valor inteiro. */
function alturaLinha(doc: PDFKit.PDFDocument, linha: LinhaFicha): number {
  doc.font(FONTES.dado).fontSize(CORPO)
  const altura = doc.heightOfString(linha.value || '—', { width: LARGURA_UTIL - COL_ROTULO - RESPIRO * 3 })
  return Math.max(15, Math.ceil(altura) + 7)
}

/** Escreve um par rótulo/valor ocupando a faixa informada. */
function escreverLinha(doc: PDFKit.PDFDocument, linha: LinhaFicha, y: number): void {
  doc.font(FONTES.rotulo).fontSize(CORPO).fillColor(CORES.texto)
    .text(linha.label, X_ESQUERDA + RESPIRO, y, { width: COL_ROTULO - RESPIRO, lineBreak: false, ellipsis: true })
  doc.font(FONTES.dado).fontSize(CORPO).fillColor(CORES.texto)
    .text(linha.value || '—', X_ESQUERDA + COL_ROTULO + RESPIRO, y, {
      width: LARGURA_UTIL - COL_ROTULO - RESPIRO * 3,
    })
}

/**
 * Ficha de dados: rótulos à esquerda, valores à direita, dentro de uma moldura
 * de fio fino com divisórias entre as linhas. É o bloco que identifica edital,
 * proponente e inscrição na abertura dos documentos.
 */
export function addInfoBlock(doc: PDFKit.PDFDocument, rows: LinhaFicha[]): void {
  if (rows.length === 0) return

  const topo = doc.y
  const alturas = rows.map((linha) => alturaLinha(doc, linha))
  const total = alturas.reduce((soma, altura) => soma + altura, 0)

  doc.save()
  doc.rect(X_ESQUERDA, topo, LARGURA_UTIL, total).strokeColor(CORES.fio).lineWidth(0.7).stroke()
  doc.moveTo(X_ESQUERDA + COL_ROTULO, topo).lineTo(X_ESQUERDA + COL_ROTULO, topo + total)
    .strokeColor(CORES.fio).lineWidth(0.4).stroke()
  doc.restore()

  let y = topo
  rows.forEach((linha, i) => {
    if (i > 0) fio(doc, y, { espessura: 0.4, cor: CORES.apoio })
    escreverLinha(doc, linha, y + 4)
    y += alturas[i]
  })

  doc.y = topo + total + 4
}

/** Uma linha de ficha isolada, para blocos montados campo a campo. */
export function addTwoColumnRow(doc: PDFKit.PDFDocument, label: string, value: string): void {
  addInfoBlock(doc, [{ label, value }])
}

// ─── Seção, divisor e destaques ──────────────────────────────────────────────

/** Cabeçalho de seção — tarja preta e régua até a margem. */
export function addCompactSection(doc: PDFKit.PDFDocument, title: string): void {
  doc.y += 6
  tarjaSecao(doc, title)
}

/** Régua discreta entre blocos. */
export function addDivider(doc: PDFKit.PDFDocument): void {
  separador(doc)
}

/** Número de protocolo em destaque, na caixa rotulada do padrão oficial. */
export function addProtocolBadge(doc: PDFKit.PDFDocument, numero: string): void {
  caixaRotulada(doc, 'Protocolo da inscrição', 18, (x, y, largura) => {
    doc.font(FONTES.codigo).fontSize(14).fillColor(CORES.tinta)
      .text(numero, x, y, { width: largura, align: 'center', characterSpacing: 1 })
  })
}

/** Nota legal ao pé do conteúdo, em serifa justificada. */
export function addLegalNotice(doc: PDFKit.PDFDocument, text: string): void {
  doc.y += 8
  fio(doc, doc.y, { espessura: 0.5, cor: CORES.apoio })
  doc.y += 7

  doc.font(FONTES.corpo).fontSize(8).fillColor(CORES.texto)
    .text(text, X_ESQUERDA, doc.y, { width: LARGURA_UTIL, align: 'justify' })
}

/** Rodapé de verificação da folha corrente. */
export function addCompactFooter(doc: PDFKit.PDFDocument): void {
  desenharRodape(doc)
}
