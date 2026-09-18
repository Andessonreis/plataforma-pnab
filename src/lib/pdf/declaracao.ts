import { maskCpfCnpjParcial } from '@/lib/utils/mask'
import type { Emissao } from '@/lib/documentos/emissao'
import { criarDocumentoOficial, finalizarDocumento } from './documento-oficial'
import { CORES, FONTES, LARGURA_UTIL, X_ESQUERDA, fio } from './documento-oficial/tema'

interface DeclaracaoData {
  proponente: {
    nome: string
    cpfCnpj: string
  }
  edital: {
    titulo: string
    ano: number
  }
  tipo: string
  dataEmissao: Date
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
}

const CORPO = 11
const LINHA_ASSINATURA = 180

/**
 * Declaração de participação ou contemplação num edital.
 *
 * Peça de texto corrido: segue a diagramação das matérias do Diário — serifa,
 * parágrafo justificado e a rubrica do órgão centralizada ao pé.
 */
export async function generateDeclaracao(data: DeclaracaoData): Promise<Buffer> {
  const doc = await criarDocumentoOficial({
    rotulo: 'Declaração',
    titulo: 'Declaração',
    subtitulo: `${data.edital.titulo} · ${data.edital.ano}`,
    emissao: data.emissao ?? null,
  })

  const situacao = data.tipo === 'contemplado' ? 'contemplado(a)' : 'inscrito(a)'

  parrafo(
    doc,
    `Declaramos, para os devidos fins, que ${data.proponente.nome}, inscrito(a) sob o CPF/CNPJ `
    + `${maskCpfCnpjParcial(data.proponente.cpfCnpj)}, encontra-se ${situacao} no edital `
    + `"${data.edital.titulo}" (${data.edital.ano}), promovido pela Secretaria de Cultura e Turismo `
    + 'de Irecê no âmbito da Política Nacional Aldir Blanc de Fomento à Cultura (PNAB).',
  )

  parrafo(doc, 'Esta declaração é válida para os fins a que se destina.')

  doc.y += 24
  doc.font(FONTES.corpo).fontSize(CORPO).fillColor(CORES.texto)
    .text(`Irecê/BA, ${porExtenso(data.dataEmissao)}.`, X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'right',
    })

  doc.y += 56
  const centro = X_ESQUERDA + LARGURA_UTIL / 2
  fio(doc, doc.y, { de: centro - LINHA_ASSINATURA / 2, ate: centro + LINHA_ASSINATURA / 2, espessura: 0.7 })
  doc.y += 6
  doc.font(FONTES.titulo).fontSize(9).fillColor(CORES.tinta)
    .text('SECRETARIA DE CULTURA E TURISMO DE IRECÊ', X_ESQUERDA, doc.y, {
      width: LARGURA_UTIL, align: 'center', characterSpacing: 0.3,
    })

  return finalizarDocumento(doc, [
    { rotulo: 'Documento', valor: 'Declaração' },
    { rotulo: 'Edital', valor: `${data.edital.titulo} (${data.edital.ano})` },
    { rotulo: 'Situação declarada', valor: situacao },
  ])
}

function parrafo(doc: PDFKit.PDFDocument, texto: string): void {
  doc.font(FONTES.corpo).fontSize(CORPO).fillColor(CORES.texto)
    .text(texto, X_ESQUERDA, doc.y, { width: LARGURA_UTIL, align: 'justify', lineGap: 3 })
  doc.y += 14
}

function porExtenso(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
  })
}
