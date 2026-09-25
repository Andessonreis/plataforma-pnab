/**
 * Mescla o PDF de dados do projeto (gerado por `projeto-completo`) com os
 * arquivos de anexo de verdade (PDF/imagem), num único documento — o "dossiê
 * completo" que a Secretaria arquiva por proponente contemplado.
 *
 * Anexos por link (vídeo) não têm arquivo pra mesclar e ficam de fora do
 * dossiê: o PDF de dados não os lista.
 */
import { PDFDocument } from 'pdf-lib'
import { downloadFile, extractStoragePath } from '@/lib/storage'

export interface AnexoParaMesclar {
  titulo: string
  url: string
}

/** Um projeto do lote: o PDF de dados já gerado e os anexos da inscrição. */
export interface ProjetoDoLote {
  pdf: Buffer
  anexos: AnexoParaMesclar[]
}

const EXT_IMAGEM = new Set(['jpg', 'jpeg', 'png'])

function extensaoDe(url: string): string {
  const semQuery = url.split('?')[0]
  return (semQuery.split('.').pop() ?? '').toLowerCase()
}

/** Acrescenta ao documento as páginas de um anexo já baixado (PDF ou imagem). */
async function incorporarArquivo(doc: PDFDocument, ext: string, bytes: Buffer): Promise<void> {
  if (ext === 'pdf') {
    const anexoDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const paginas = await doc.copyPages(anexoDoc, anexoDoc.getPageIndices())
    paginas.forEach((p) => doc.addPage(p))
  } else if (EXT_IMAGEM.has(ext)) {
    const imagem = ext === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
    const pagina = doc.addPage([imagem.width, imagem.height])
    pagina.drawImage(imagem, { x: 0, y: 0, width: imagem.width, height: imagem.height })
  }
  // outras extensões: não deveriam existir (upload já restringe a pdf/png/jpg)
}

/**
 * Baixa cada anexo do storage e acrescenta suas páginas ao final do documento.
 * Anexo que não é PDF/imagem (ex.: link de vídeo), que não baixa ou cujo
 * arquivo está corrompido é pulado, sem interromper os demais: um arquivo
 * ruim de um proponente não pode derrubar o lote inteiro.
 */
async function anexarArquivos(doc: PDFDocument, anexos: AnexoParaMesclar[]): Promise<void> {
  for (const anexo of anexos) {
    const path = extractStoragePath('propostas', anexo.url)
    if (!path) continue // link externo (vídeo) — sem arquivo pra baixar

    try {
      await incorporarArquivo(doc, extensaoDe(path), await downloadFile('propostas', path))
    } catch (err) {
      console.error({ message: 'Anexo não pôde ser incorporado ao dossiê completo', anexo: anexo.titulo, err })
    }
  }
}

/** Copia todas as páginas de um PDF já gerado para o fim do documento. */
async function acrescentarPdf(doc: PDFDocument, pdf: Buffer): Promise<void> {
  const origem = await PDFDocument.load(pdf)
  const paginas = await doc.copyPages(origem, origem.getPageIndices())
  paginas.forEach((p) => doc.addPage(p))
}

/**
 * Recebe o PDF de dados já gerado e a lista de anexos da inscrição e anexa
 * suas páginas ao final do documento.
 */
export async function mesclarAnexosNoPdf(
  pdfDadosBuffer: Buffer,
  anexos: AnexoParaMesclar[],
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfDadosBuffer)
  await anexarArquivos(doc, anexos)
  return Buffer.from(await doc.save())
}

/**
 * Junta vários projetos num único PDF, na ordem em que chegam. Com
 * `incluirAnexos`, cada projeto vem seguido dos seus anexos. Os projetos são
 * consumidos um a um: quem chama pode gerá-los sob demanda, sem manter todos
 * os PDFs em memória ao mesmo tempo.
 */
export async function juntarProjetos(
  projetos: AsyncIterable<ProjetoDoLote>,
  incluirAnexos: boolean,
): Promise<Buffer> {
  const doc = await PDFDocument.create()

  for await (const { pdf, anexos } of projetos) {
    await acrescentarPdf(doc, pdf)
    if (incluirAnexos) await anexarArquivos(doc, anexos)
  }

  return Buffer.from(await doc.save())
}
