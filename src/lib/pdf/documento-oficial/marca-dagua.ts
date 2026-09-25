import { CORES, FONTES, PAGINA } from './tema'

/**
 * Marca d'água diagonal "PRÉVIA", esmaecida, no fundo da folha corrente.
 *
 * Serve às duas versões de layout: cada uma a chama ao abrir toda folha, antes
 * do cabeçalho, para que o carimbo fique por baixo do conteúdo.
 */
export function desenharMarcaDagua(doc: PDFKit.PDFDocument): void {
  // `text` move o cursor: sem guardar a posição, o carimbo empurraria o
  // conteúdo da folha nova pra onde a diagonal terminou.
  const { x, y } = doc
  doc.save()
  doc.rotate(-24, { origin: [PAGINA.largura / 2, PAGINA.altura / 2] })
  doc.font(FONTES.titulo).fontSize(80).fillColor(CORES.tinta).opacity(0.06)
    .text('PRÉVIA', 0, PAGINA.altura / 2 - 40, { width: PAGINA.largura, align: 'center' })
  doc.opacity(1).restore()
  doc.x = x
  doc.y = y
}
