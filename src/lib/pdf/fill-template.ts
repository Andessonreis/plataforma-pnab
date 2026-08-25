import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface FillField {
  /** Índice da página (0-based). */
  page: number
  x: number
  y: number
  value: string
  size: number
  /** Largura da área a cobrir com retângulo branco antes de escrever o valor. */
  coverWidth: number
  coverHeight?: number
}

/**
 * Preenche um PDF existente sem alterar o texto original: cobre cada área de
 * campo com um retângulo branco e escreve o valor por cima, no lugar exato do
 * colchete/placeholder do documento-fonte. O restante do PDF (layout,
 * cabeçalho, corpo do texto) permanece byte a byte intacto — só o próprio
 * conteúdo do documento é regravado ao salvar (`doc.save()`), não reescrito.
 */
export async function fillPdfTemplate(templateBytes: Buffer | Uint8Array, fields: FillField[]): Promise<Buffer> {
  const doc = await PDFDocument.load(templateBytes)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const textColor = rgb(0.118, 0.161, 0.212) // #1e293b — mesmo tom de texto usado em src/lib/pdf/shared.ts

  for (const field of fields) {
    const page = doc.getPage(field.page)
    const coverHeight = field.coverHeight ?? field.size + 3

    page.drawRectangle({
      x: field.x - 1,
      y: field.y - 4,
      width: field.coverWidth,
      height: coverHeight,
      color: rgb(1, 1, 1),
    })

    page.drawText(field.value, {
      x: field.x,
      y: field.y,
      size: field.size,
      font,
      color: textColor,
    })
  }

  return Buffer.from(await doc.save())
}
