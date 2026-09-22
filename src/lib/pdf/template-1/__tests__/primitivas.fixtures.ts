import { PDFDocument, PDFRawStream, decodePDFRawStream } from 'pdf-lib'
import type { Emissao } from '@/lib/documentos/emissao'
import { desenharAvisoLegal, desenharBlocoInfo, desenharDivisor, desenharSecao } from '../blocos'
import { desenharCabecalhoCompacto } from '../cabecalho'
import { abrirDocumento, finalizarDocumento, garantirEspaco } from '../pagina'
import { desenharTabela, type ColunaTabela, type LinhaTabela } from '../tabela'

/**
 * Documento de prova das primitivas e leitura do PDF gerado.
 *
 * O texto é lido direto do fluxo de conteúdo de cada página: o PDFKit grava as
 * letras em hexadecimal, intercaladas com os ajustes de kerning, então só os
 * grupos `<...>` de cada operador `TJ` são aproveitados.
 */

export const GERADO_EM = new Date('2026-09-21T17:32:00Z')

export const EMISSAO: Emissao = {
  codigo: 'PNAB-K7M2-P4XQ',
  emitidoEm: GERADO_EM,
  urlVerificacao: 'https://culturaeturismo.irece.ba.gov.br/verificar/PNAB-K7M2-P4XQ',
  hashConteudo: 'a'.repeat(64),
  template: 1,
}

export const TITULO = 'Documento de Prova das Primitivas'

export const COLUNAS: ColunaTabela[] = [
  { label: 'Nº', width: 28 },
  { label: 'Protocolo', width: 80 },
  { label: 'Nome', width: 210 },
  { label: 'CPF/CNPJ', width: 85 },
  { label: 'Telefone', width: 92.28 },
]

/** Protocolo impresso na linha `posicao` (1-based) da tabela de prova. */
export function protocolo(posicao: number): string {
  return `PNAB-2026-${String(posicao).padStart(4, '0')}`
}

export function linhas(total: number): LinhaTabela[] {
  return Array.from({ length: total }, (_, i) => ({
    valores: [
      String(i + 1),
      protocolo(i + 1),
      `Proponente de Teste ${i + 1}`,
      '123.***.***-01',
      '(74) 99999-0000',
    ],
  }))
}

/** Lista com cabeçalho compacto, bloco de informações, tabela e aviso legal. */
export function documentoDeProva(total: number, emissao: Emissao | null): Promise<Buffer> {
  const doc = abrirDocumento({ titulo: TITULO, emissao, geradoEm: GERADO_EM })

  desenharCabecalhoCompacto(doc, TITULO)
  desenharBlocoInfo(doc, [
    { label: 'Edital', value: 'Edital de teste das primitivas' },
    { label: 'Ano', value: '2026' },
    { label: 'Total na lista', value: `${total} inscrição(ões)` },
  ])
  desenharDivisor(doc)
  desenharSecao(doc, 'Inscrições')
  desenharTabela(doc, COLUNAS, linhas(total), { vazio: 'Nenhum registro encontrado.' })

  doc.y += 8
  garantirEspaco(doc, 50)
  desenharAvisoLegal(doc, 'Documento de prova gerado apenas para conferir as primitivas de desenho.')

  return finalizarDocumento(doc)
}

// As fontes padrão do PDF gravam o texto em WinAnsi, que só difere do latin1
// na faixa 0x80–0x9F — onde moram o travessão e as aspas tipográficas.
const WINANSI: Record<number, string> = {
  0x85: '…', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
}

function decodificar(bytes: Buffer): string {
  return Array.from(bytes, (byte) => WINANSI[byte] ?? String.fromCharCode(byte)).join('')
}

function textoDaPagina(fluxo: PDFRawStream): string {
  const bruto = Buffer.from(decodePDFRawStream(fluxo).decode()).toString('latin1')

  return [...bruto.matchAll(/\[([^\]]*)\]\s*TJ/g)]
    .map(([, corpo]) => {
      const hex = [...corpo.matchAll(/<([0-9a-fA-F]+)>/g)].map(([, grupo]) => grupo).join('')
      return decodificar(Buffer.from(hex, 'hex'))
    })
    .join('\n')
}

export interface PdfLido {
  titulo: string | undefined
  /** Texto de cada página, na ordem em que saem impressas. */
  paginas: string[]
}

export async function lerPdf(buffer: Buffer): Promise<PdfLido> {
  const pdf = await PDFDocument.load(buffer)

  return {
    titulo: pdf.getTitle(),
    paginas: pdf.getPages().map((pagina) => textoDaPagina(pagina.node.Contents() as PDFRawStream)),
  }
}
