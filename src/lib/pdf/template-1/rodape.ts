import { contextoDe } from '@/lib/pdf/documento-oficial/contexto'
import { dataHora, fio } from '@/lib/pdf/documento-oficial/tema'
import { COLORS, LARGURA_UTIL, MARGINS, NOME_PORTAL, PAGINA } from './tema'

/**
 * Rodapé da versão 1 — a tarja discreta no pé de cada folha.
 *
 * Traz a data de geração e a paginação, como no layout anterior, e ganhou a
 * linha de emissão: quem recebe uma folha solta consegue conferir no portal que
 * aquele documento saiu daqui. O número da página vem do contexto do documento,
 * não de um contador passado de mão em mão — era assim que a primeira folha
 * acabava numerada como "Página 2".
 */

/** Faixa reservada ao rodapé no pé da folha, descontada do limite de conteúdo. */
export const ALTURA_RODAPE = 60

const Y_FIO = PAGINA.altura - 50

/**
 * Desenha o rodapé da folha corrente.
 *
 * A margem inferior é zerada durante o desenho: escrever na faixa do pé com a
 * margem ativa faz o PDFKit abrir uma página automática no meio do rodapé, e
 * era daí que vinham as folhas fantasma quase em branco.
 */
export function desenharRodape(doc: PDFKit.PDFDocument): void {
  const ctx = contextoDe(doc)
  const margemOriginal = doc.page.margins.bottom
  doc.page.margins.bottom = 0

  fio(doc, Y_FIO, { espessura: 0.3, cor: COLORS.border })

  const y = Y_FIO + 6
  doc.font('Helvetica').fontSize(7).fillColor(COLORS.textLight)
    .text(`${NOME_PORTAL} — Documento gerado em ${dataHora(ctx.geradoEm)}`, MARGINS.left, y, {
      width: LARGURA_UTIL, align: 'left', lineBreak: false,
    })

  doc.text(`Pág. ${ctx.pagina}`, MARGINS.left, y, {
    width: LARGURA_UTIL, align: 'right', lineBreak: false,
  })

  if (ctx.emissao) {
    doc.font('Helvetica').fontSize(6.8).fillColor(COLORS.textLight)
      .text(
        `Emissão nº ${ctx.emissao.codigo} · confira em ${ctx.emissao.urlVerificacao}`,
        MARGINS.left, y + 9, { width: LARGURA_UTIL, align: 'left', lineBreak: false },
      )
  }

  doc.page.margins.bottom = margemOriginal
}
