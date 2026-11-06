import { contentTypePorExtensao } from '@/lib/storage/content-type'
import { validateMagicBytes } from '@/lib/upload/validate'
import { extensaoDoArquivo, problemaDoArquivoManual, type ExtensaoManual } from './regras'

type DocumentoLido =
  | { ok: true; buffer: Buffer; ext: ExtensaoManual; mime: string }
  | { ok: false; message: string }

/**
 * Confere extensão, tamanho e assinatura de bytes antes de gravar. O tipo vem da
 * extensão, não do navegador: muitos sistemas mandam DOC/XLS sem MIME ou errado.
 */
export async function lerDocumentoValidado(file: File): Promise<DocumentoLido> {
  const problema = problemaDoArquivoManual(file)
  if (problema) return { ok: false, message: problema }

  const ext = extensaoDoArquivo(file.name) as ExtensaoManual
  const mime = contentTypePorExtensao(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, mime)) {
    return { ok: false, message: 'O conteúdo do arquivo não corresponde à extensão informada.' }
  }
  return { ok: true, buffer, ext, mime }
}
