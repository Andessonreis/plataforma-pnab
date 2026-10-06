import path from 'path'
import fs from 'fs'
import { abrirDocumento, finalizarDocumento, novaPagina } from './template-1/pagina'
import { desenharTimbre } from './template-1/cabecalho'
import { desenharBlocoInfo, desenharDivisor, desenharSecao, desenharAvisoLegal } from './template-1/blocos'
import { COLORS, LARGURA_UTIL, MARGINS, PAGINA } from './template-1/tema'
import { maskCpfCnpj } from '@/lib/utils/mask'

export async function gerarPdfRecursoAlexander(agora: Date = new Date()): Promise<Buffer> {
  const titulo = 'Formulário de Interposição de Recurso (Anexo XI)'
  const subtitulo = 'Fase de Habilitação Documental — Festival de Arte e Cultura de Irecê (Centenário 2026)'

  const doc = abrirDocumento({
    titulo: `${titulo} — Alexander Gondim Barretto (PNAB-2026-0024)`,
    geradoEm: agora,
  })

  // Página 1: Formulário Oficial Digitalizado
  desenharTimbre(doc, {
    titulo: 'Anexo XI — Formulário de Interposição de Recurso',
    subtitulo: 'Edital Festival de Arte e Cultura de Irecê — Centenário da Cidade (2026)',
    programa: 'POLÍTICA NACIONAL ALDIR BLANC (PNAB) · LEI Nº 14.399/2022',
  })

  desenharSecao(doc, '1. Identificação do Agente Cultural e Proposta')
  desenharBlocoInfo(doc, [
    { label: 'Nome do Agente Cultural', value: 'Alexander Gondim Barretto' },
    { label: 'CPF / CNPJ', value: maskCpfCnpj('05849484507') },
    { label: 'Número de Inscrição', value: 'PNAB-2026-0024' },
    { label: 'Nome do Projeto Inscrito', value: 'O Amuleto: 100 anos de Histórias e Afeto.' },
    { label: 'Categoria', value: 'Audiovisual / Cinema' },
    { label: 'Modalidade / Nota', value: 'Ampla concorrência  ·  87,50 pontos (2º lugar)' },
    { label: 'Etapa Recorrida', value: 'Habilitação / Entrega de documentos' },
  ])
  desenharDivisor(doc)

  desenharSecao(doc, '2. Objeto do Recurso')
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.text)
    .text(
      'Com base na legislação vigente da LEI ALDIR BLANC IRECÊ 2024, venho solicitar alteração da etapa supracitada, conforme justificativa a seguir.',
      MARGINS.left,
      doc.y,
      { width: LARGURA_UTIL, align: 'justify' },
    )
  doc.y += 10

  desenharSecao(doc, '3. Justificativa Apresentada pelo Proponente')
  const yBox = doc.y
  const textoJustificativa =
    '“Aguardando a emissão da certidão Federal, que infelizmente foi emitida um dia após o prazo final da entrega. A mesma se encontra anexo a esta interposição.”'
  const alturaBox = 44
  doc.rect(MARGINS.left, yBox, LARGURA_UTIL, alturaBox).fillAndStroke(COLORS.background, COLORS.border)
  doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(COLORS.text)
    .text(textoJustificativa, MARGINS.left + 10, yBox + 10, { width: LARGURA_UTIL - 20, align: 'justify' })
  doc.y = yBox + alturaBox + 8

  // Data e Assinatura do Declarante
  const yDataAss = doc.y
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.text)
    .text('Irecê – BA, 02 de outubro de 2026', MARGINS.left, yDataAss)

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.text)
    .text('Alexander Gondim Barretto', MARGINS.left + LARGURA_UTIL - 220, yDataAss, { width: 220, align: 'right' })
  doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.textLight)
    .text('ASSINATURA DO DECLARANTE (PROTOCOLADO FISICAMENTE)', MARGINS.left + LARGURA_UTIL - 220, yDataAss + 11, { width: 220, align: 'right' })

  doc.y = yDataAss + 28
  desenharDivisor(doc)

  desenharSecao(doc, '4. Julgamento do Recurso pela Secretaria de Cultura')
  const yDecisao = doc.y
  const altDecisao = 72
  doc.rect(MARGINS.left, yDecisao, LARGURA_UTIL, altDecisao).fillAndStroke(COLORS.destaque, COLORS.destaqueBorda)

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.sucesso)
    .text('DECISÃO: DEFERIDO — HABILITAÇÃO CONFIRMADA', MARGINS.left + 10, yDecisao + 8)

  doc.font('Helvetica').fontSize(8).fillColor(COLORS.text)
    .text('Protocolo: 02/10/2026 (Tempestivo)  ·  Julgamento: 06/10/2026  ·  Órgão: Secretaria Municipal de Cultura', MARGINS.left + 10, yDecisao + 22)

  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.text)
    .text('Parecer Conclusivo: Recurso tempestivo conhecido e provido. O proponente apresentou a regularização e entrega da Certidão Negativa de Débitos Federais. Conforme determinação da Secretaria de Cultura, a proposta passa à condição de HABILITADA na relação definitiva.', MARGINS.left + 10, yDecisao + 35, { width: LARGURA_UTIL - 20 })

  doc.y = yDecisao + altDecisao + 10

  desenharAvisoLegal(
    doc,
    'Este documento constitui a digitalização e formalização no Sistema PNAB Irecê do recurso protocolado fisicamente pelo proponente em 02/10/2026, com decisão proferida pela Secretaria Municipal de Cultura e Turismo em 06/10/2026.',
  )

  // Página 2: Comprovante Físico Digitalizado (Foto da folha assinada)
  novaPagina(doc)

  doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.brandDark)
    .text('ANEXO — CÓPIA DIGITALIZADA DO FORMULÁRIO FÍSICO ORIGINAL', MARGINS.left, MARGINS.top - 10, { width: LARGURA_UTIL, align: 'center' })
  doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textLight)
    .text('Documento assinado pelo proponente e protocolado na Secretaria Municipal de Cultura e Turismo de Irecê em 02/10/2026', MARGINS.left, MARGINS.top + 6, { width: LARGURA_UTIL, align: 'center' })

  const imgPath = path.resolve('public/documentos/recurso-habilitacao_PNAB-2026-0024_comprovante-fisico.jpeg')
  if (fs.existsSync(imgPath)) {
    const imgY = MARGINS.top + 28
    const maxLargura = LARGURA_UTIL - 40
    const maxAltura = PAGINA.altura - imgY - MARGINS.bottom - 20

    // Centralizar imagem
    const imgX = MARGINS.left + 20
    doc.rect(imgX - 2, imgY - 2, maxLargura + 4, maxAltura + 4).stroke(COLORS.border)
    doc.image(imgPath, imgX, imgY, { fit: [maxLargura, maxAltura], align: 'center', valign: 'center' })
  }

  return finalizarDocumento(doc)
}
