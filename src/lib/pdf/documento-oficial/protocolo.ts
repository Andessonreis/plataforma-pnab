import { contextoDe } from './contexto'
import { caixaRotulada, linhaDado } from './blocos'
import { desenharEncerramento, desenharRodape, ALTURA_ENCERRAMENTO } from './rodape'
import { novaPagina, docParaBuffer } from './pagina'
import {
  CORES, FONTES, PAGINA, LARGURA_UTIL, X_ESQUERDA, LIMITE_CONTEUDO, fio, dataHora,
} from './tema'

/**
 * Protocolo de emissão, no desenho da folha de assinatura do Diário Oficial:
 * caixas rotuladas com o que foi emitido, o código de verificação e o hash do
 * conteúdo, mais o QR que leva à página pública de conferência.
 */

export interface ItemProtocolo {
  rotulo: string
  valor: string
}

const LADO_QR = 96
const ALTURA_LINHA = 12

const NOTAS = [
  'A verificação confirma que este documento foi emitido pelo Portal PNAB Irecê, na data indicada, '
  + 'com o conteúdo registrado sob o código e o hash acima.',
  'O hash é calculado sobre os dados que originaram o documento, não sobre o arquivo: reemitir o mesmo '
  + 'conteúdo produz o mesmo hash, e qualquer divergência aparece na conferência.',
  'Este registro atesta a emissão do documento pelo sistema da Secretaria de Cultura e Turismo de Irecê '
  + 'e não constitui assinatura digital de pessoa física ou jurídica.',
]

/** Altura estimada do bloco, para decidir se ele cabe no que restou da folha. */
function alturaProtocolo(doc: PDFKit.PDFDocument, itens: ItemProtocolo[]): number {
  const caixa = (interna: number) => interna + 7 + 10 + 12
  doc.font(FONTES.corpo).fontSize(7.5)
  const alturaNotas = NOTAS.reduce(
    (soma, nota) => soma + doc.heightOfString(nota, { width: LARGURA_UTIL - LADO_QR - 16 }) + 6,
    0,
  )
  return 30
    + caixa(itens.length * ALTURA_LINHA)
    + caixa(32)
    + caixa(26)
    + Math.max(LADO_QR, alturaNotas)
}

/** Desenha o protocolo a partir da posição corrente. */
function desenharProtocolo(doc: PDFKit.PDFDocument, itens: ItemProtocolo[]): void {
  const ctx = contextoDe(doc)
  const emissao = ctx.emissao
  if (!emissao) return

  doc.font(FONTES.titulo).fontSize(13).fillColor(CORES.tinta)
    .text('PROTOCOLO DE EMISSÃO', X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'center', characterSpacing: 0.4,
    })
  doc.y += 12

  caixaRotulada(doc, 'Documento', itens.length * ALTURA_LINHA, (x, y, largura) => {
    itens.forEach((item, i) => linhaDado(doc, item.rotulo, item.valor, x, y + i * ALTURA_LINHA, largura))
  })

  caixaRotulada(doc, 'Código para verificação', 32, (x, y, largura) => {
    doc.font(FONTES.codigo).fontSize(13).fillColor(CORES.tinta)
      .text(emissao.codigo, x, y, { width: largura, align: 'center', characterSpacing: 1 })
    doc.font(FONTES.corpo).fontSize(8).fillColor(CORES.texto)
      .text(`Confira em ${emissao.urlVerificacao}`, x, y + 19, { width: largura, align: 'center' })
  })

  caixaRotulada(doc, 'Hash do conteúdo', 26, (x, y, largura) => {
    doc.font(FONTES.codigo).fontSize(7.5).fillColor(CORES.tinta)
      .text(emissao.hashConteudo, x, y, { width: largura, align: 'center' })
    doc.font(FONTES.corpo).fontSize(8).fillColor(CORES.texto)
      .text(`Emitido em ${dataHora(emissao.emitidoEm)}`, x, y + 14, { width: largura, align: 'center' })
  })

  const topoNotas = doc.y
  const larguraNotas = LARGURA_UTIL - LADO_QR - 16

  if (ctx.qrGrande) {
    doc.image(ctx.qrGrande, PAGINA.largura - PAGINA.margem.direita - LADO_QR, topoNotas, {
      width: LADO_QR, height: LADO_QR,
    })
  }

  let y = topoNotas
  for (const nota of NOTAS) {
    doc.font(FONTES.corpo).fontSize(7.5).fillColor(CORES.texto)
      .text(nota, X_ESQUERDA, y, { width: larguraNotas, align: 'justify' })
    y = doc.y + 6
  }

  doc.y = Math.max(y, topoNotas + LADO_QR)
}

/**
 * Fecha o documento: protocolo de emissão e encerramento institucional.
 *
 * O protocolo segue o corpo do documento quando cabe na folha; senão ganha
 * página própria, com um respiro abaixo do cromo. As marcas do programa
 * aparecem uma vez só, pequenas, no encerramento — repetidas grandes no topo
 * da folha de protocolo elas roubavam a página do conteúdo.
 */
export async function finalizarDocumento(
  doc: PDFKit.PDFDocument,
  itens: ItemProtocolo[] = [],
): Promise<Buffer> {
  const ctx = contextoDe(doc)
  const pePagina = LIMITE_CONTEUDO - ALTURA_ENCERRAMENTO

  if (ctx.emissao) {
    if (doc.y + alturaProtocolo(doc, itens) + 24 > pePagina) {
      novaPagina(doc)
      doc.y += 34
    } else {
      doc.y += 10
      fio(doc, doc.y, { espessura: 0.5, cor: CORES.apoio })
      doc.y += 14
    }

    desenharProtocolo(doc, itens)
  }

  if (doc.y + 10 > pePagina) novaPagina(doc)
  desenharEncerramento(doc, pePagina)
  desenharRodape(doc)
  return docParaBuffer(doc)
}
