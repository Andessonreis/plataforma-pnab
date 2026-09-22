/**
 * Relação oficial de inscrições por status/fase do edital, na versão 2 do
 * layout (padrão Diário Oficial).
 *
 * Aqui só se desenha: título, ficha, colunas, valores das linhas, avisos e
 * protocolo vêm de `modelo/lista-inscricoes`, o mesmo conteúdo que a versão 1
 * imprime. Os três recortes — agrupada por área, restrita a uma área ou
 * contínua — fecham com o mesmo protocolo de emissão: a lista publicada tem que
 * ser verificável independentemente do recorte.
 */
import {
  addInfoBlock, addDivider, addLegalNotice, addCompactSection,
} from '../layout-helpers'
import {
  addTableHeader, addTableRows, addTableTotal, checkPageBreak,
} from '../table-helpers'
import { criarDocumentoOficial, finalizarDocumento } from '../documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from '../documento-oficial/tema'
import { montarListaInscricoes, type ResumoPorArea } from '../modelo/lista-inscricoes'
import type { ListaInscricoesData, ListaInscricoesItem } from '../modelo/tipos'

export type { ListaInscricoesItem, ListaInscricoesData }

/** Quadro-resumo da distribuição por área, em duas colunas. */
function desenharResumoPorArea(doc: PDFKit.PDFDocument, resumo: ResumoPorArea | null): void {
  if (!resumo) return

  addCompactSection(doc, resumo.titulo)

  const larguraColuna = LARGURA_UTIL / 2 - 5
  const topo = doc.y
  const porColuna = Math.ceil(resumo.areas.length / 2)

  resumo.areas.forEach(({ area, total }, i) => {
    const segundaColuna = i >= porColuna
    const x = segundaColuna ? X_ESQUERDA + larguraColuna + 10 : X_ESQUERDA
    const y = topo + (segundaColuna ? i - porColuna : i) * 12

    doc.font(FONTES.corpo).fontSize(8.5).fillColor(CORES.texto)
      .text(`${area}:`, x, y, { continued: true, width: larguraColuna })
    doc.font(FONTES.titulo).text(` ${total}`)
  })

  doc.y = topo + porColuna * 12 + 8
  addDivider(doc)
}

export async function generateListaInscricoes(data: ListaInscricoesData): Promise<Buffer> {
  const modelo = montarListaInscricoes(data)
  const doc = await criarDocumentoOficial({
    rotulo: modelo.rotulo,
    titulo: modelo.titulo,
    subtitulo: modelo.subtitulo,
    emissao: data.emissao ?? null,
  })

  addInfoBlock(doc, modelo.ficha)
  addDivider(doc)
  desenharResumoPorArea(doc, modelo.resumoPorArea)

  for (const secao of modelo.secoes) {
    // Cada área abre folha nova se não couber o título, o cabeçalho e as primeiras linhas.
    if (modelo.agrupada) checkPageBreak(doc, 60)
    addCompactSection(doc, secao.titulo)
    addTableHeader(doc, modelo.colunas)
    addTableRows(doc, modelo.colunas, secao.linhas)
    if (modelo.agrupada) doc.y += 10
  }

  addTableTotal(doc, modelo.textoTotal)

  checkPageBreak(doc, 60)
  addLegalNotice(doc, modelo.avisoLegal)

  return finalizarDocumento(doc, modelo.protocolo)
}
