import { randomUUID } from 'crypto'
import { uploadFile, deleteFile, extractStoragePathFromUrl } from '@server/lib/storage'
import { validateMagicBytes } from '@shared/upload/validate'
import { editaisRepository } from '@server/modules/editais/repository/editais.repository'
import { EditalNaoEncontradoError } from '@server/modules/editais/errors/editais.errors'
import type { ArquivoEditalUploadMeta } from '@shared/schemas/arquivos-edital.schema'
import { arquivosEditalRepository } from '../repository/arquivos-edital.repository'
import { ArquivoEditalNaoEncontradoError, ArquivoInvalidoError } from '../errors/arquivos-edital.errors'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
}

export const arquivosEditalService = {
  async list(editalId: string) {
    const edital = await editaisRepository.findById(editalId)
    if (!edital) throw new EditalNaoEncontradoError()
    return arquivosEditalRepository.listByEdital(editalId)
  },

  async upload(editalId: string, file: File, meta: ArquivoEditalUploadMeta) {
    const edital = await editaisRepository.findById(editalId)
    if (!edital) throw new EditalNaoEncontradoError()

    if (!ALLOWED_MIME.includes(file.type)) {
      throw new ArquivoInvalidoError('Tipo de arquivo não permitido. Aceitos: PDF, PNG, JPEG, XLSX')
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new ArquivoInvalidoError('O arquivo deve ter no máximo 10 MB')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!validateMagicBytes(buffer, file.type)) {
      throw new ArquivoInvalidoError('Conteúdo do arquivo não corresponde ao tipo declarado')
    }

    const ext = MIME_TO_EXT[file.type] ?? 'bin'
    const fileId = randomUUID().split('-')[0]
    const storagePath = `edital-${editalId}/${fileId}.${ext}`
    const publicUrl = await uploadFile('editais', storagePath, buffer, file.type)

    return arquivosEditalRepository.create({
      edital: { connect: { id: editalId } },
      tipo: meta.tipo,
      titulo: meta.titulo,
      url: publicUrl,
      acessivel: meta.acessivel ?? false,
    })
  },

  async remove(arquivoId: string) {
    const arquivo = await arquivosEditalRepository.findById(arquivoId)
    if (!arquivo) throw new ArquivoEditalNaoEncontradoError()

    try {
      const storagePath = extractStoragePathFromUrl(arquivo.url, 'editais')
      if (storagePath) await deleteFile('editais', storagePath)
    } catch (err) {
      console.error({ warn: 'falha_deletar_storage', error: err instanceof Error ? err.message : 'Unknown' })
    }

    await arquivosEditalRepository.delete(arquivoId)
  },
}
