/**
 * Relação oficial de inscrições por status/fase do edital.
 *
 * Sai em três recortes: agrupada por área, restrita a uma área ou contínua com
 * a categoria em coluna. Os três fecham com o mesmo protocolo de emissão — a
 * lista publicada tem que ser verificável independentemente do recorte.
 */
import {
  addInfoBlock, addDivider, addLegalNotice, addCompactSection,
} from '../layout-helpers'
import {
  addTableHeader, addTableRow, calculateRowHeight, checkPageBreak, type ColumnDef,
} from '../table-helpers'
import { criarDocumentoOficial, finalizarDocumento } from '../documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA } from '../documento-oficial/tema'
import type { Emissao } from '@/lib/documentos/emissao'
import {
  buildRowValues, getColumns, STATUS_COM_TELEFONE, type ListaInscricoesItem,
} from './colunas'

export type { ListaInscricoesItem }

export interface ListaInscricoesData {
  edital: { titulo: string; ano: number }
  categoria?: string | null
  status: string
  statusLabel: string
  tituloDocumento?: string
  inscricoes: ListaInscricoesItem[]
  total: number
  agruparPorCategoria?: boolean
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
}

export function tituloDe(data: ListaInscricoesData): string {
  if (data.tituloDocumento) return data.tituloDocumento
  if (data.status === 'ENVIADA') return 'Relação de Inscritos'
  if (data.status === 'HABILITADA') return 'Relação Definitiva de Habilitados'
  if (data.status === 'RASCUNHO') return 'Relação de Inscrições em Rascunho'
  return `Relação de Inscrições — ${data.statusLabel}`
}

/**
 * Aviso de rodapé. Rascunho não é lista oficial nem publicável: são inscrições
 * inacabadas, e o documento leva telefone pra equipe entrar em contato.
 */
function avisoLegal(status: string): string {
  if (STATUS_COM_TELEFONE.has(status)) {
    return 'Documento interno de trabalho gerado pela plataforma Portal PNAB Irecê. '
      + 'Relaciona inscrições iniciadas e ainda não enviadas na data de geração, com telefone '
      + 'para contato da equipe da Secretaria. Não constitui lista oficial e não deve ser '
      + 'publicado nem compartilhado fora da Secretaria — contém dados pessoais protegidos pela LGPD.'
  }
  return 'Este documento é uma lista oficial gerada pela plataforma Portal PNAB Irecê. '
    + 'Os dados apresentados correspondem às informações registradas no sistema na data de geração. '
    + 'Para contestações e recursos, consulte os prazos estabelecidos no edital.'
}

/** Corpo da tabela: mede cada linha, quebra a página e repete o cabeçalho. */
function desenharLinhas(
  doc: PDFKit.PDFDocument,
  colunas: ColumnDef[],
  itens: ListaInscricoesItem[],
  status: string,
  ocultarCategoria: boolean,
): void {
  itens.forEach((item, i) => {
    const valores = buildRowValues(
      ocultarCategoria ? { ...item, posicao: i + 1 } : item,
      status,
      ocultarCategoria,
    )
    const altura = calculateRowHeight(doc, colunas, valores)
    checkPageBreak(doc, altura + 2, colunas)
    addTableRow(doc, colunas, valores, altura)
  })
}

/** Total em destaque ao pé da tabela. */
function desenharTotal(doc: PDFKit.PDFDocument, texto: string): void {
  doc.y += 8
  checkPageBreak(doc, 30)
  doc.font(FONTES.rotulo).fontSize(9).fillColor(CORES.tinta)
    .text(texto, X_ESQUERDA, doc.y, { width: LARGURA_UTIL })
}

/** Quadro-resumo da distribuição por área, em duas colunas. */
function desenharResumoPorArea(doc: PDFKit.PDFDocument, grupos: Map<string, ListaInscricoesItem[]>): void {
  const areas = Array.from(grupos.keys()).sort()
  if (areas.length <= 1) return

  addCompactSection(doc, 'Distribuição por área / categoria')

  const larguraColuna = LARGURA_UTIL / 2 - 5
  const topo = doc.y
  const porColuna = Math.ceil(areas.length / 2)

  areas.forEach((area, i) => {
    const segundaColuna = i >= porColuna
    const x = segundaColuna ? X_ESQUERDA + larguraColuna + 10 : X_ESQUERDA
    const y = topo + (segundaColuna ? i - porColuna : i) * 12

    doc.font(FONTES.corpo).fontSize(8.5).fillColor(CORES.texto)
      .text(`${area}:`, x, y, { continued: true, width: larguraColuna })
    doc.font(FONTES.titulo).text(` ${grupos.get(area)!.length}`)
  })

  doc.y = topo + porColuna * 12 + 8
  addDivider(doc)
}

export async function generateListaInscricoes(data: ListaInscricoesData): Promise<Buffer> {
  const titulo = tituloDe(data)
  const doc = await criarDocumentoOficial({
    rotulo: 'Inscrições',
    titulo,
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })

  const agrupada = Boolean(data.agruparPorCategoria)
  const porArea = Boolean(data.categoria)
  const ocultarCategoria = agrupada || porArea
  const colunas = getColumns(data.status, ocultarCategoria)

  const grupos = new Map<string, ListaInscricoesItem[]>()
  for (const item of data.inscricoes) {
    const area = item.categoria || 'Sem categoria definida'
    grupos.set(area, [...(grupos.get(area) ?? []), item])
  }

  addInfoBlock(doc, [
    { label: 'Edital', value: data.edital.titulo },
    ...(porArea ? [{ label: 'Área / categoria', value: data.categoria! }] : []),
    { label: 'Ano', value: String(data.edital.ano) },
    { label: 'Situação das inscrições', value: data.statusLabel },
    {
      label: 'Total na lista',
      value: agrupada
        ? `${data.total} inscrição(ões) em ${grupos.size} área(s)`
        : `${data.total} inscrição(ões)`,
    },
  ])
  addDivider(doc)

  if (agrupada) {
    desenharResumoPorArea(doc, grupos)

    for (const area of Array.from(grupos.keys()).sort()) {
      const itens = grupos.get(area)!
      checkPageBreak(doc, 60)
      addCompactSection(doc, `${area} (${itens.length})`)
      addTableHeader(doc, colunas)
      desenharLinhas(doc, colunas, itens, data.status, true)
      doc.y += 10
    }
    desenharTotal(doc, `Total geral do edital: ${data.total} inscrição(ões)`)
  } else {
    addCompactSection(doc, porArea ? `Inscrições — ${data.categoria}` : 'Inscrições')
    addTableHeader(doc, colunas)
    desenharLinhas(doc, colunas, data.inscricoes, data.status, ocultarCategoria)
    desenharTotal(doc, `Total: ${data.total} inscrição(ões)`)
  }

  checkPageBreak(doc, 60)
  addLegalNotice(doc, avisoLegal(data.status))

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: titulo },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Situação das inscrições', valor: data.statusLabel },
    { rotulo: 'Categoria', valor: data.categoria ?? 'Todas' },
    { rotulo: 'Inscrições', valor: String(data.total) },
  ])
}
