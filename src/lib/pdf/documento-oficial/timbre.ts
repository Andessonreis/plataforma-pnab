import { contextoDe } from './contexto'
import { carregarMarca, MARCAS, PROPORCAO } from './assets'
import { caixaRotulada } from './blocos'
import {
  CORES, FONTES, PAGINA, LARGURA_UTIL, X_ESQUERDA, X_DIREITA,
  fio, dataPorExtenso,
} from './tema'

/**
 * Timbre dos documentos oficiais, no desenho do Diário Oficial de Irecê.
 *
 * Toda folha abre com o mesmo cromo — quadrado preto com o número da página,
 * órgão emissor, data e código de emissão — para que uma folha solta continue
 * se identificando. A régua institucional e o título só aparecem na primeira
 * página, que é onde a matéria começa.
 */

const CAIXA_PAGINA = { largura: 64, altura: 38, topo: 30 }
const X_CROMO = X_ESQUERDA + CAIXA_PAGINA.largura + 8
const ORGAO = 'PORTAL PNAB IRECÊ · SECRETARIA DE CULTURA E TURISMO'

/** Cromo de identificação impresso no topo de todas as páginas. */
export function desenharCromo(doc: PDFKit.PDFDocument): void {
  const ctx = contextoDe(doc)
  const { topo, largura, altura } = CAIXA_PAGINA

  doc.rect(X_ESQUERDA, topo, largura, altura).fill(CORES.tinta)
  doc.font(FONTES.titulo).fontSize(16).fillColor(CORES.papel)
    .text(String(ctx.pagina), X_ESQUERDA, topo + 10, { width: largura, align: 'center' })

  doc.font(FONTES.rotulo).fontSize(8).fillColor(CORES.tinta)
    .text(ORGAO, X_CROMO, topo + 2, {
      width: X_DIREITA - X_CROMO, align: 'right', characterSpacing: 0.2, lineBreak: false,
    })

  fio(doc, topo + 15, { de: X_CROMO, espessura: 1.1 })

  doc.font(FONTES.rotulo).fontSize(8.5).fillColor(CORES.tinta)
    .text(ctx.rotulo.toUpperCase(), X_CROMO, topo + 24, {
      width: 200, characterSpacing: 0.4, lineBreak: false,
    })

  const identificacao = ctx.emissao
    ? `EMISSÃO Nº ${ctx.emissao.codigo}`
    : 'DOCUMENTO SEM REGISTRO DE EMISSÃO'

  doc.font(FONTES.dado).fontSize(7.5).fillColor(CORES.apoio)
    .text(dataPorExtenso(ctx.geradoEm), X_CROMO, topo + 19, {
      width: X_DIREITA - X_CROMO, align: 'right', lineBreak: false,
    })
  doc.font(FONTES.dado).fontSize(7.5).fillColor(CORES.apoio)
    .text(identificacao, X_CROMO, topo + 29, {
      width: X_DIREITA - X_CROMO, align: 'right', lineBreak: false,
    })

  doc.y = PAGINA.margem.topo
}

/**
 * Abertura da primeira página: régua institucional, título e subtítulo.
 *
 * A régua é a assinatura visual do município e já traz Prefeitura, centenário e
 * Secretaria — repetir a logo da SECULT ao lado seria dizer a mesma coisa duas
 * vezes. O título vem centralizado em serifa, como as matérias do Diário.
 */
export function desenharAbertura(doc: PDFKit.PDFDocument): void {
  const ctx = contextoDe(doc)

  const regua = carregarMarca(MARCAS.regua)
  if (regua) {
    const largura = 400
    const x = (PAGINA.largura - largura) / 2
    doc.image(regua, x, doc.y + 6, { width: largura })
    doc.y += 6 + largura * PROPORCAO.regua + 20
  }

  doc.font(FONTES.titulo).fontSize(13).fillColor(CORES.tinta)
    .text(ctx.titulo.toUpperCase(), X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'center', characterSpacing: 0.3,
    })

  if (ctx.subtitulo) {
    doc.y += 3
    doc.font(FONTES.corpo).fontSize(10.5).fillColor(CORES.texto)
      .text(ctx.subtitulo, X_ESQUERDA, doc.y, { width: LARGURA_UTIL, align: 'center' })
  }

  doc.y += 16

  if (ctx.aviso) desenharAviso(doc, ctx.aviso)
}

/** Tarja de alerta — documento de trabalho, prévia, uso restrito. */
function desenharAviso(doc: PDFKit.PDFDocument, aviso: string): void {
  doc.font(FONTES.corpo).fontSize(8.5)
  const altura = doc.heightOfString(aviso, { width: LARGURA_UTIL - 20, align: 'justify' })

  caixaRotulada(doc, 'Atenção', altura, (x, y, largura) => {
    doc.font(FONTES.corpo).fontSize(8.5).fillColor(CORES.texto)
      .text(aviso, x, y, { width: largura, align: 'justify' })
  })
}
