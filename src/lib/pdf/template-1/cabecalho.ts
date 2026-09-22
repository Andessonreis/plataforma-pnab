import { carregarMarca, MARCAS } from '@/lib/pdf/documento-oficial/assets'
import { fio } from '@/lib/pdf/documento-oficial/tema'
import { COLORS, LARGURA_UTIL, MARGINS, NOME_ORGAO, NOME_PORTAL, PAGINA } from './tema'

/**
 * Cabeçalhos da versão 1.
 *
 * São dois, como no layout anterior: o compacto, que abre as listas de trabalho
 * gastando pouco espaço vertical, e o timbrado, com brasão do município e logo
 * da Secretaria, reservado às peças que a Secretaria publica ou assina.
 *
 * O timbre era copiado no relatório final e na classificação, cada cópia com
 * suas medidas — aqui é um só, e o que muda de documento para documento entra
 * por parâmetro.
 */

const PREFEITURA = 'PREFEITURA MUNICIPAL DE IRECÊ'

const FAIXA_COMPACTA = 6
const FAIXA_TIMBRE = 8
const LARGURA_CIDADES = 76
const LARGURA_BRASAO = 42
const LARGURA_SECULT = 84

export interface OpcoesTimbre {
  titulo: string
  /** Linha abaixo do título — normalmente o edital e o ano. */
  subtitulo?: string
  /** Programa a que a peça se refere, impresso no timbre (ex.: PNAB 2026). */
  programa?: string
}

/**
 * Cabeçalho compacto: faixa verde, assinatura da plataforma e título centrado.
 *
 * Ocupa cerca de 50pt — é o que sobra de espaço para a tabela numa lista de
 * várias páginas. A logo do programa fica no canto direito, alinhada à margem.
 */
export function desenharCabecalhoCompacto(doc: PDFKit.PDFDocument, titulo: string): void {
  doc.rect(0, 0, PAGINA.largura, FAIXA_COMPACTA).fill(COLORS.brand)

  const topo = MARGINS.top - 10

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.brand)
    .text(NOME_PORTAL.toUpperCase(), MARGINS.left, topo, { continued: true })
    .font('Helvetica').fontSize(8).fillColor(COLORS.textLight)
    .text(`  —  ${NOME_ORGAO}`, { align: 'left' })

  doc.font('Helvetica-Bold').fontSize(15).fillColor(COLORS.text)
    .text(titulo, MARGINS.left, topo + 14, { width: LARGURA_UTIL, align: 'center' })

  const cidades = carregarMarca(MARCAS.cidades)
  if (cidades) {
    const x = PAGINA.largura - MARGINS.right - LARGURA_CIDADES
    doc.image(cidades, x, topo - 4, { width: LARGURA_CIDADES })
  }

  const yRegua = topo + 32
  fio(doc, yRegua, { espessura: 0.5, cor: COLORS.border })
  doc.y = yRegua + 8
}

/**
 * Cabeçalho timbrado: brasão à esquerda, logo da Secretaria à direita e o
 * título do documento abaixo da régua institucional.
 *
 * Documento sem a marca no disco sai mesmo assim, só que sem a imagem — falha
 * de leitura de arquivo não pode derrubar a geração de um relatório.
 */
export function desenharTimbre(doc: PDFKit.PDFDocument, opcoes: OpcoesTimbre): void {
  doc.rect(0, 0, PAGINA.largura, FAIXA_TIMBRE).fill(COLORS.brand)

  const topo = MARGINS.top - 15
  const brasao = carregarMarca(MARCAS.brasao)
  const secult = carregarMarca(MARCAS.secult)

  if (brasao) {
    doc.image(brasao, MARGINS.left, topo - 6, { width: LARGURA_BRASAO })
  }
  if (secult) {
    const x = PAGINA.largura - MARGINS.right - LARGURA_SECULT
    doc.image(secult, x, topo + 6, { width: LARGURA_SECULT })
  }

  const recuo = brasao ? LARGURA_BRASAO + 10 : 0
  const x = MARGINS.left + recuo
  const largura = LARGURA_UTIL - recuo - (secult ? LARGURA_SECULT + 14 : 0)

  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.text)
    .text(PREFEITURA, x, topo, { width: largura, lineBreak: false })
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.textLight)
    .text(NOME_ORGAO, x, topo + 14, { width: largura, lineBreak: false })

  if (opcoes.programa) {
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.textLight)
      .text(opcoes.programa, x, topo + 26, { width: largura, lineBreak: false })
  }

  // Régua dupla: o fio verde da marca sobre o fio fino de apoio.
  const yRegua = topo + 52
  fio(doc, yRegua, { espessura: 1, cor: COLORS.brand })
  fio(doc, yRegua + 2, { espessura: 0.5, cor: COLORS.border })

  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.brandDark)
    .text(opcoes.titulo.toUpperCase(), MARGINS.left, yRegua + 14, {
      width: LARGURA_UTIL, align: 'center',
    })

  if (opcoes.subtitulo) {
    doc.y += 4
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.text)
      .text(opcoes.subtitulo, MARGINS.left, doc.y, { width: LARGURA_UTIL, align: 'center' })
  }

  doc.y += 12
}
