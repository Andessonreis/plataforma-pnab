import { contextoDe } from './contexto'
import { carregarMarca, MARCAS, PROPORCAO } from './assets'
import {
  CORES, FONTES, PAGINA, LARGURA_UTIL, X_ESQUERDA, X_DIREITA,
  fio, dataHora, NOME_ORGAO,
} from './tema'

/**
 * Rodapé de verificação e encerramento institucional.
 *
 * O texto diz "emitido" e "registro de emissão", nunca "assinado": o que o
 * portal prova é que gerou aquele documento, naquela data, com aquele conteúdo
 * — e é exatamente isso que a página de verificação confirma.
 */

const LADO_QR = 28
const ENDERECO = [
  NOME_ORGAO,
  'Praça Teotônio Marques Dourado Filho, nº 1 — Centro · Irecê/BA',
  'Município de Irecê · CNPJ 13.715.891/0001-04',
]

/**
 * Rodapé de toda página.
 *
 * Desenha com a margem inferior zerada: escrever na faixa do pé com a margem
 * ativa faz o PDFKit abrir uma página automática no meio do rodapé, e era daí
 * que vinham as folhas fantasma quase em branco.
 */
export function desenharRodape(doc: PDFKit.PDFDocument): void {
  const ctx = contextoDe(doc)
  const margemOriginal = doc.page.margins.bottom
  doc.page.margins.bottom = 0

  const y = PAGINA.altura - PAGINA.margem.base + 4
  const larguraTexto = LARGURA_UTIL - LADO_QR - 12

  fio(doc, y - 6, { espessura: 0.5, cor: CORES.apoio })

  if (ctx.emissao) {
    if (ctx.qr) doc.image(ctx.qr, X_DIREITA - LADO_QR, y - 2, { width: LADO_QR, height: LADO_QR })

    doc.font(FONTES.corpo).fontSize(6.4).fillColor(CORES.apoio)
      .text(
        `Este documento foi emitido eletronicamente pelo Portal PNAB Irecê em ${dataHora(ctx.geradoEm)}, `
        + `sob o código ${ctx.emissao.codigo}.`,
        X_ESQUERDA, y, { width: larguraTexto, lineBreak: false },
      )
    doc.font(FONTES.corpo).fontSize(6.4).fillColor(CORES.apoio)
      .text(
        `Confira a autenticidade em ${ctx.emissao.urlVerificacao} ou pelo QR ao lado.`,
        X_ESQUERDA, y + 9, { width: larguraTexto, lineBreak: false },
      )
  } else {
    doc.font(FONTES.corpo).fontSize(6.4).fillColor(CORES.apoio)
      .text(
        `Documento gerado pelo Portal PNAB Irecê em ${dataHora(ctx.geradoEm)}, sem registro de emissão.`,
        X_ESQUERDA, y, { width: LARGURA_UTIL, lineBreak: false },
      )
  }

  doc.page.margins.bottom = margemOriginal
}

/** Altura ocupada pelo encerramento, para o chamador reservar espaço. */
export const ALTURA_ENCERRAMENTO = 52

/** Marcas do programa lado a lado, alinhadas pela base. */
function desenharMarcasPrograma(doc: PDFKit.PDFDocument, y: number): void {
  const pnab = carregarMarca(MARCAS.pnab)
  const cidades = carregarMarca(MARCAS.cidades)
  const larguraPnab = 44
  const larguraCidades = 60
  let x = X_ESQUERDA

  if (pnab) {
    doc.image(pnab, x, y, { width: larguraPnab })
    x += larguraPnab + 16
  }
  if (cidades) {
    const recuo = (larguraPnab * PROPORCAO.pnab - larguraCidades * PROPORCAO.cidades) / 2
    doc.image(cidades, x, y + 4 + recuo, { width: larguraCidades })
  }
}

/**
 * Encerramento da última página: marcas do programa à esquerda e endereço do
 * órgão à direita, como fecham as matérias do Diário. É o único lugar do
 * documento onde as marcas do programa aparecem.
 */
export function desenharEncerramento(doc: PDFKit.PDFDocument, y: number): void {
  fio(doc, y, { espessura: 0.5, cor: CORES.apoio })

  const base = y + 12
  desenharMarcasPrograma(doc, base + 4)

  ENDERECO.forEach((linha, i) => {
    doc.font(FONTES.corpo).fontSize(6.5).fillColor(CORES.apoio)
      .text(linha, X_ESQUERDA, base + 2 + i * 8, {
        width: LARGURA_UTIL, align: 'right', lineBreak: false,
      })
  })
}
