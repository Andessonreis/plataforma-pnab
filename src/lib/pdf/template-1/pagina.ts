import { registrarContexto } from '@/lib/pdf/documento-oficial/contexto'
import { docParaBuffer } from '@/lib/pdf/documento-oficial/pagina'
import type { Emissao } from '@/lib/documentos/emissao'
import { criarDocumento, MARGINS, PAGINA } from './tema'
import { ALTURA_RODAPE, desenharRodape } from './rodape'

/**
 * Ciclo de vida da folha na versão 1: abertura, quebra de página e fechamento.
 *
 * O estado do documento (página corrente, emissão, momento da geração) fica
 * pendurado no próprio PDFDocument, no mesmo registro que os documentos
 * oficiais usam — o rodapé lê dali em vez de receber o número da página por
 * parâmetro, que era o arranjo que desalinhava a numeração.
 */

export interface AberturaDocumento {
  /** Título gravado nos metadados do arquivo (o que o leitor de PDF mostra). */
  titulo: string
  /** Registro de emissão; null quando o registro falhou — o PDF sai mesmo assim. */
  emissao?: Emissao | null
  /** Momento impresso no rodapé; padrão é agora. */
  geradoEm?: Date
  /** Desenhado no topo de toda folha, inclusive a primeira (marca d'água, timbre). */
  aoAbrirPagina?: (doc: PDFKit.PDFDocument) => void
}

/** Última coordenada utilizável antes de invadir a faixa do rodapé. */
export const LIMITE_CONTEUDO = PAGINA.altura - MARGINS.bottom - ALTURA_RODAPE

/** Abre o documento da versão 1 com o contexto e a numeração já armados. */
export function abrirDocumento(opcoes: AberturaDocumento): PDFKit.PDFDocument {
  const doc = criarDocumento(opcoes.titulo)

  const contexto = {
    rotulo: opcoes.titulo,
    titulo: opcoes.titulo,
    emissao: opcoes.emissao ?? null,
    // A versão 1 não imprime QR: o rodapé leva o código de emissão por extenso.
    qr: null,
    qrGrande: null,
    pagina: 1,
    geradoEm: opcoes.geradoEm ?? new Date(),
  }
  registrarContexto(doc, contexto)

  // Toda folha nova passa pelo evento — inclusive a que o PDFKit abre sozinho
  // ao estourar a margem. Sem isso, uma quebra automática sairia sem o timbre e
  // com a numeração atrasada em relação ao resto do documento.
  doc.on('pageAdded', () => {
    contexto.pagina += 1
    opcoes.aoAbrirPagina?.(doc)
  })

  opcoes.aoAbrirPagina?.(doc)
  return doc
}

/** Fecha a folha corrente e abre a seguinte. */
export function novaPagina(doc: PDFKit.PDFDocument): void {
  desenharRodape(doc)
  doc.addPage()
}

/**
 * Abre página nova quando o bloco não cabe no que restou da folha.
 * Devolve `true` quando houve quebra, para o chamador repetir o que for de topo.
 */
export function garantirEspaco(doc: PDFKit.PDFDocument, altura: number): boolean {
  if (doc.y + altura <= LIMITE_CONTEUDO) return false
  novaPagina(doc)
  return true
}

/** Fecha a última folha com o rodapé e serializa o arquivo. */
export function finalizarDocumento(doc: PDFKit.PDFDocument): Promise<Buffer> {
  desenharRodape(doc)
  return docParaBuffer(doc)
}
