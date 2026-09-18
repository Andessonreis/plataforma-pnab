import type { Emissao } from '@/lib/documentos/emissao'

/**
 * Estado que todo documento oficial carrega enquanto é desenhado.
 *
 * Fica pendurado no próprio PDFDocument: o número da página, a emissão e o QR
 * são lidos pelo cabeçalho e pelo rodapé de cada folha, e passar isso de mão em
 * mão por dez geradores era exatamente o que fazia a numeração sair errada
 * ("Página 2" na primeira folha) quando um deles esquecia de incrementar.
 */
export interface DocumentoOficial {
  /** Rótulo curto do tipo de documento, impresso no cromo de toda página. */
  rotulo: string
  titulo: string
  subtitulo?: string
  /** Tarja de alerta na abertura (ex.: prévia de trabalho não publicável). */
  aviso?: string
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao: Emissao | null
  /** QR pequeno do rodapé, reaproveitado em todas as páginas. */
  qr: Buffer | null
  /** QR grande do protocolo. */
  qrGrande: Buffer | null
  pagina: number
  geradoEm: Date
}

const registro = new WeakMap<PDFKit.PDFDocument, DocumentoOficial>()

export function registrarContexto(doc: PDFKit.PDFDocument, contexto: DocumentoOficial): void {
  registro.set(doc, contexto)
}

/**
 * Contexto do documento em desenho.
 *
 * Só falha se alguém criar o PDFDocument por fora de `criarDocumentoOficial` —
 * e aí o cabeçalho e o rodapé não teriam o que imprimir mesmo.
 */
export function contextoDe(doc: PDFKit.PDFDocument): DocumentoOficial {
  const contexto = registro.get(doc)
  if (!contexto) {
    throw new Error('Documento PDF criado fora de criarDocumentoOficial().')
  }
  return contexto
}
