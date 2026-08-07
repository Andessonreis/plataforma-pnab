/**
 * Mescla o PDF de dados do projeto (gerado por `projeto-completo.ts`) com os
 * arquivos de anexo de verdade (PDF/imagem), num único documento — o "dossiê
 * completo" que a Secretaria arquiva por proponente contemplado.
 *
 * Anexos por link (vídeo) não têm arquivo pra mesclar — ficam só na seção de
 * dados, como já acontecia antes.
 */
import { PDFDocument } from 'pdf-lib'
import { downloadFile, extractStoragePath } from '@/lib/storage'

export interface AnexoParaMesclar {
  titulo: string
  url: string
}

const EXT_IMAGEM = new Set(['jpg', 'jpeg', 'png'])

function extensaoDe(url: string): string {
  const semQuery = url.split('?')[0]
  return (semQuery.split('.').pop() ?? '').toLowerCase()
}

/**
 * Recebe o PDF de dados já gerado e a lista de anexos da inscrição, baixa
 * cada arquivo do storage e anexa suas páginas ao final do documento.
 * Anexos que não são PDF/imagem (ex.: link de vídeo) são ignorados aqui —
 * já aparecem listados na seção "Anexos" do PDF de dados.
 */
export async function mesclarAnexosNoPdf(
  pdfDadosBuffer: Buffer,
  anexos: AnexoParaMesclar[],
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfDadosBuffer)

  for (const anexo of anexos) {
    const path = extractStoragePath('propostas', anexo.url)
    if (!path) continue // link externo (vídeo) — sem arquivo pra baixar

    const ext = extensaoDe(path)
    let bytes: Buffer
    try {
      bytes = await downloadFile('propostas', path)
    } catch (err) {
      console.error({ message: 'Falha ao baixar anexo pro dossiê completo', anexo: anexo.titulo, err })
      continue
    }

    if (ext === 'pdf') {
      const anexoDoc = await PDFDocument.load(bytes, { ignoreEncryption: true }).catch(() => null)
      if (!anexoDoc) {
        console.error({ message: 'Anexo declarado como PDF não pôde ser lido', anexo: anexo.titulo })
        continue
      }
      const paginas = await doc.copyPages(anexoDoc, anexoDoc.getPageIndices())
      paginas.forEach((p) => doc.addPage(p))
    } else if (EXT_IMAGEM.has(ext)) {
      const imagem = ext === 'png' ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
      const pagina = doc.addPage([imagem.width, imagem.height])
      pagina.drawImage(imagem, { x: 0, y: 0, width: imagem.width, height: imagem.height })
    }
    // outras extensões: não deveriam existir (upload já restringe a pdf/png/jpg)
  }

  return Buffer.from(await doc.save())
}
