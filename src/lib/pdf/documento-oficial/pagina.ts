import PDFDocument from 'pdfkit'
import { registrarContexto } from './contexto'
import { gerarQrCode } from './assets'
import { desenharCromo, desenharAbertura } from './timbre'
import { desenharRodape } from './rodape'
import { PAGINA, LIMITE_CONTEUDO, NOME_ORGAO } from './tema'
import type { Emissao } from '@/lib/documentos/emissao'

/** Ciclo de vida da folha: criação, quebra de página e fechamento do arquivo. */

export interface AberturaDocumento {
  /** Rótulo curto do tipo, impresso no cromo de toda página (ex.: "Classificação"). */
  rotulo: string
  titulo: string
  subtitulo?: string
  /** Tarja de alerta na abertura (ex.: prévia de trabalho não publicável). */
  aviso?: string
  /** Registro de emissão; null quando o registro falhou (o PDF sai mesmo assim). */
  emissao?: Emissao | null
  /** Momento impresso no cabeçalho e no rodapé; padrão é agora. */
  geradoEm?: Date
  /** Carimbo desenhado no fundo de cada folha (ex.: "PRÉVIA"), antes do cromo. */
  marcaDagua?: (doc: PDFKit.PDFDocument) => void
}

/**
 * Abre um documento oficial já timbrado na primeira página.
 *
 * Os dois QR (rodapé e protocolo) são gerados aqui, uma vez por documento, e
 * ficam no contexto — antes cada gerador refazia os seus, com tamanhos
 * diferentes a cada arquivo.
 */
export async function criarDocumentoOficial(
  opcoes: AberturaDocumento,
): Promise<PDFKit.PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: PAGINA.margem.topo,
      bottom: PAGINA.margem.base,
      left: PAGINA.margem.esquerda,
      right: PAGINA.margem.direita,
    },
    info: {
      Title: opcoes.titulo,
      Author: NOME_ORGAO,
      Creator: 'Portal PNAB Irecê',
    },
  })

  const emissao = opcoes.emissao ?? null
  const contexto = {
    rotulo: opcoes.rotulo,
    titulo: opcoes.titulo,
    subtitulo: opcoes.subtitulo,
    aviso: opcoes.aviso,
    emissao,
    qr: emissao ? await gerarQrCode(emissao.urlVerificacao, 28) : null,
    qrGrande: emissao ? await gerarQrCode(emissao.urlVerificacao, 110) : null,
    pagina: 1,
    geradoEm: opcoes.geradoEm ?? new Date(),
  }
  registrarContexto(doc, contexto)

  // Toda folha nova recebe o cromo pelo evento — inclusive a que o PDFKit abre
  // sozinho ao estourar a margem. Sem isso, uma quebra automática produzia
  // página sem cabeçalho e desalinhava a numeração do documento inteiro.
  doc.on('pageAdded', () => {
    contexto.pagina += 1
    opcoes.marcaDagua?.(doc)
    desenharCromo(doc)
  })

  opcoes.marcaDagua?.(doc)
  desenharCromo(doc)
  desenharAbertura(doc)
  return doc
}

/** Fecha a folha corrente e abre a seguinte — o cromo vem pelo evento. */
export function novaPagina(doc: PDFKit.PDFDocument): void {
  desenharRodape(doc)
  doc.addPage()
}

/** Abre página nova quando o bloco não cabe no que restou da folha. */
export function garantirEspaco(doc: PDFKit.PDFDocument, altura: number): boolean {
  if (doc.y + altura <= LIMITE_CONTEUDO) return false
  novaPagina(doc)
  return true
}

/** Serializa o documento já finalizado. */
export function docParaBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const partes: Buffer[] = []
    doc.on('data', (parte: Buffer) => partes.push(parte))
    doc.on('end', () => resolve(Buffer.concat(partes)))
    doc.on('error', reject)
    doc.end()
  })
}
