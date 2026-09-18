import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA, X_DIREITA, fio } from './tema'

/**
 * Primitivas de composição do Diário: tarja preta rotulando o bloco e caixa de
 * fio fino. São elas que dão ao documento a cara de peça oficial sem precisar
 * de cor — o rótulo em negativo é o que separa uma seção da outra.
 */

const ALTURA_TARJA = 14
const RESPIRO_TARJA = 8

/** Largura que uma tarja precisa para caber o rótulo. */
function larguraTarja(doc: PDFKit.PDFDocument, rotulo: string): number {
  doc.font(FONTES.rotulo).fontSize(8)
  return Math.ceil(doc.widthOfString(rotulo.toUpperCase(), { characterSpacing: 0.6 })) + RESPIRO_TARJA * 2
}

/** Desenha a tarja preta com o rótulo em negativo e devolve sua largura. */
function desenharTarja(doc: PDFKit.PDFDocument, rotulo: string, x: number, y: number): number {
  const largura = larguraTarja(doc, rotulo)
  doc.rect(x, y, largura, ALTURA_TARJA).fill(CORES.tinta)
  doc.font(FONTES.rotulo).fontSize(8).fillColor(CORES.papel)
    .text(rotulo.toUpperCase(), x + RESPIRO_TARJA, y + 3.6, {
      characterSpacing: 0.6, lineBreak: false,
    })
  return largura
}

/**
 * Cabeçalho de seção: tarja preta à esquerda e régua fechando até a margem,
 * como as divisões "DECRETOS" e "EDITAIS" do sumário do Diário.
 */
export function tarjaSecao(doc: PDFKit.PDFDocument, rotulo: string): void {
  const y = doc.y
  desenharTarja(doc, rotulo, X_ESQUERDA, y)
  fio(doc, y + ALTURA_TARJA, { espessura: 1 })
  doc.y = y + ALTURA_TARJA + 6
}

/**
 * Caixa de conteúdo com o rótulo montado sobre a borda superior.
 *
 * `desenhar` recebe a área interna já posicionada e não precisa se preocupar
 * com a moldura; a caixa fecha na altura informada.
 */
export function caixaRotulada(
  doc: PDFKit.PDFDocument,
  rotulo: string,
  alturaInterna: number,
  desenhar: (x: number, y: number, largura: number) => void,
): void {
  const topoTarja = doc.y
  const topoCaixa = topoTarja + ALTURA_TARJA / 2
  const altura = alturaInterna + ALTURA_TARJA / 2 + 10

  doc.save()
  doc.rect(X_ESQUERDA, topoCaixa, LARGURA_UTIL, altura)
    .strokeColor(CORES.fio).lineWidth(0.7).stroke()
  doc.restore()

  // A tarja cobre o trecho de borda onde ela se apoia, como no protocolo de
  // assinatura do Diário: o rótulo "monta" na moldura em vez de flutuar dentro.
  const largura = larguraTarja(doc, rotulo)
  doc.rect(X_ESQUERDA, topoCaixa - 0.7, largura, 1.4).fill(CORES.papel)
  desenharTarja(doc, rotulo, X_ESQUERDA, topoTarja)

  desenhar(X_ESQUERDA + 10, topoCaixa + ALTURA_TARJA / 2 + 5, LARGURA_UTIL - 20)
  doc.y = topoCaixa + altura + 12
}

/** Par rótulo/valor numa linha só, no espaçamento das caixas do protocolo. */
export function linhaDado(
  doc: PDFKit.PDFDocument,
  rotulo: string,
  valor: string,
  x: number,
  y: number,
  largura: number,
): void {
  doc.font(FONTES.rotulo).fontSize(8).fillColor(CORES.texto)
  const recuo = doc.widthOfString(`${rotulo}: `)
  doc.text(`${rotulo}:`, x, y, { lineBreak: false })
  doc.font(FONTES.dado).fontSize(8).fillColor(CORES.texto)
    .text(valor || '—', x + recuo, y, { width: largura - recuo, lineBreak: false, ellipsis: true })
}

/** Régua discreta separando blocos de conteúdo. */
export function separador(doc: PDFKit.PDFDocument): void {
  doc.y += 5
  fio(doc, doc.y, { espessura: 0.5, cor: CORES.apoio })
  doc.y += 7
}

export { X_ESQUERDA, X_DIREITA, LARGURA_UTIL }
