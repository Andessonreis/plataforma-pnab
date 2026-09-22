/**
 * Relatório final de resultado do edital.
 *
 * Peça de publicidade do art. 37 da Constituição: consolida contemplados,
 * suplentes e não contemplados depois da análise de recursos, e fecha com o
 * espaço de assinatura da Secretaria.
 */
import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import {
  addTableHeader, addTableRow, calculateRowHeight, checkPageBreak, type ColumnDef,
} from './table-helpers'
import {
  addInfoBlock, addDivider, addLegalNotice, addCompactSection,
} from './layout-helpers'
import { criarDocumentoOficial, finalizarDocumento, garantirEspaco } from './documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA, fio } from './documento-oficial/tema'
import type { InscricaoItem, RelatorioFinalData } from './modelo/tipos'

export type { InscricaoItem, RelatorioFinalData }

const COLUNAS: ColumnDef[] = [
  { label: 'Pos.', width: 28, align: 'center' },
  { label: 'Protocolo', width: 72 },
  { label: 'Nome', width: 130 },
  { label: 'CPF/CNPJ', width: 68, align: 'center' },
  { label: 'Categoria', width: 152.28 },
  { label: 'Nota', width: 45, align: 'right' },
]

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** "03 de abril de 2026" — fecho da peça, acima da linha de assinatura. */
function dataPorExtenso(data: Date): string {
  return `${String(data.getDate()).padStart(2, '0')} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`
}

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Uma faixa do resultado — contemplados, suplentes ou não contemplados. */
function desenharFaixa(doc: PDFKit.PDFDocument, titulo: string, itens: InscricaoItem[]): void {
  if (itens.length === 0) return

  garantirEspaco(doc, 70)
  addCompactSection(doc, `${titulo} (${itens.length})`)
  addTableHeader(doc, COLUNAS)

  for (const item of itens) {
    const valores = [
      String(item.posicao),
      item.numero,
      item.nome,
      maskCpfCnpjParcial(item.cpfCnpj),
      item.categoria ?? '—',
      item.notaFinal !== null ? Number(item.notaFinal).toFixed(2) : '—',
    ]
    const altura = calculateRowHeight(doc, COLUNAS, valores)
    checkPageBreak(doc, altura + 2, COLUNAS)
    addTableRow(doc, COLUNAS, valores, altura)
  }

  doc.y += 10
}

/** Local, data e linha de assinatura da Secretaria. */
function desenharAssinatura(doc: PDFKit.PDFDocument): void {
  garantirEspaco(doc, 120)
  doc.y += 18

  doc.font(FONTES.corpo).fontSize(10).fillColor(CORES.texto)
    .text(`Irecê/BA, ${dataPorExtenso(new Date())}.`, X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'center',
    })

  doc.y += 46
  fio(doc, doc.y, {
    de: X_ESQUERDA + LARGURA_UTIL * 0.25,
    ate: X_ESQUERDA + LARGURA_UTIL * 0.75,
    espessura: 0.7,
  })

  doc.y += 6
  doc.font(FONTES.titulo).fontSize(9.5).fillColor(CORES.tinta)
    .text('SECRETÁRIO(A) DE CULTURA E TURISMO', X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'center', characterSpacing: 0.3,
    })
  doc.font(FONTES.corpo).fontSize(8.5).fillColor(CORES.apoio)
    .text('Prefeitura Municipal de Irecê', X_ESQUERDA, doc.y + 2, {
      width: LARGURA_UTIL, align: 'center',
    })

  doc.y += 14
}

export async function generateRelatorioFinal(data: RelatorioFinalData): Promise<Buffer> {
  const doc = await criarDocumentoOficial({
    rotulo: 'Relatório final',
    titulo: 'Relatório Final de Resultado',
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })

  addInfoBlock(doc, [
    { label: 'Edital', value: data.edital.titulo },
    { label: 'Ano', value: String(data.edital.ano) },
    {
      label: 'Publicado em',
      value: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    },
    { label: 'Inscrições avaliadas', value: String(data.totalAvaliados) },
    { label: 'Contemplados', value: String(data.contemplados.length) },
    { label: 'Suplentes', value: String(data.suplentes.length) },
    { label: 'Não contemplados', value: String(data.naoContemplados.length) },
    ...(data.edital.valorTotal
      ? [{ label: 'Valor total do edital', value: brl(data.edital.valorTotal) }]
      : []),
  ])
  addDivider(doc)

  desenharFaixa(doc, 'Contemplados', data.contemplados)
  desenharFaixa(doc, 'Suplentes', data.suplentes)
  desenharFaixa(doc, 'Não contemplados', data.naoContemplados)

  desenharAssinatura(doc)

  checkPageBreak(doc, 60)
  addLegalNotice(
    doc,
    'Este documento constitui o relatório final oficial de resultado do edital acima identificado, '
    + 'gerado pela plataforma Portal PNAB Irecê. As informações apresentadas correspondem ao resultado '
    + 'definitivo após a análise de recursos, para fins de transparência e publicidade, conforme o '
    + 'art. 37 da Constituição Federal e a legislação da Política Nacional Aldir Blanc.',
  )

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: 'Relatório final do edital' },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Avaliadas', valor: String(data.totalAvaliados) },
    { rotulo: 'Contemplados', valor: String(data.contemplados.length) },
    { rotulo: 'Suplentes', valor: String(data.suplentes.length) },
  ])
}
