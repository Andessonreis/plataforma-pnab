import { uploadFile, deleteFile, getSignedUrl } from '@/lib/storage'
import { validateMagicBytes, sanitizeFilename } from '@/lib/upload/validate'
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ALLOWED_MIMES, MIME_LABEL } from '@/lib/upload/anexo-config'
import { logAudit } from '@/lib/audit'
import { ForbiddenError } from '@server/lib/http/errors'
import { InscricaoNaoEncontradaError } from '@server/modules/inscricoes/errors/inscricoes.errors'
import type { AnexoUploadMeta } from '@shared/schemas/anexos-inscricao.schema'
import { anexosInscricaoRepository } from '../repository/anexos-inscricao.repository'
import { AnexoNaoEncontradoError, ArquivoInvalidoError } from '../errors/anexos-inscricao.errors'

const BUCKET = 'propostas'

function storagePathFromUrl(url: string): string | undefined {
  return new URL(url).pathname.split(`/${BUCKET}/`).pop()
}

export async function uploadAnexo(
  inscricaoId: string,
  file: File,
  meta: AnexoUploadMeta,
  userId: string,
  ip?: string,
) {
  const inscricao = await anexosInscricaoRepository.findInscricaoParaAnexo(inscricaoId)
  if (!inscricao) throw new InscricaoNaoEncontradaError()
  if (inscricao.proponenteId !== userId) throw new ForbiddenError('Acesso negado.')
  if (inscricao.status !== 'RASCUNHO') throw new ForbiddenError('Apenas rascunhos podem receber anexos.')

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ArquivoInvalidoError(`Arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`)
  }
  if (!ALLOWED_MIMES.includes(file.type as (typeof ALLOWED_MIMES)[number])) {
    throw new ArquivoInvalidoError(`Tipo de arquivo não permitido. Aceitos: ${MIME_LABEL}.`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, file.type)) {
    throw new ArquivoInvalidoError('Conteúdo do arquivo não corresponde ao tipo declarado.')
  }

  const safeName = sanitizeFilename(file.name)
  const storagePath = `inscricoes/${inscricaoId}/${safeName}`
  const url = await uploadFile(BUCKET, storagePath, buffer, file.type)

  let anexo
  try {
    anexo = await anexosInscricaoRepository.createAnexo({
      inscricaoId,
      tipo: meta.tipo,
      titulo: meta.titulo,
      url,
    })
  } catch (dbError) {
    try {
      await deleteFile(BUCKET, storagePath)
    } catch {
      console.error('[anexo] Falha ao remover arquivo órfão do storage')
    }
    throw dbError
  }

  await logAudit({
    userId,
    action: 'ANEXO_ENVIADO',
    entity: 'AnexoInscricao',
    entityId: anexo.id,
    details: { inscricaoId, tipo: meta.tipo, filename: safeName },
    ip,
  })

  return anexo
}

export async function removeAnexo(inscricaoId: string, anexoId: string, userId: string) {
  const anexo = await anexosInscricaoRepository.findAnexoComInscricao(anexoId)
  if (!anexo || anexo.inscricaoId !== inscricaoId) throw new AnexoNaoEncontradoError()
  if (anexo.inscricao.proponenteId !== userId) throw new ForbiddenError('Acesso negado.')
  if (anexo.inscricao.status !== 'RASCUNHO') {
    throw new ForbiddenError('Apenas rascunhos podem ter anexos removidos.')
  }

  const storagePath = storagePathFromUrl(anexo.url)
  if (storagePath) {
    try {
      await deleteFile(BUCKET, storagePath)
    } catch {
      console.error('[anexo] Falha ao remover arquivo do storage')
    }
  }

  await anexosInscricaoRepository.deleteAnexo(anexoId)
  return { mensagem: 'Anexo removido.' }
}

export async function getAnexoSignedUrl(inscricaoId: string, anexoId: string) {
  const anexo = await anexosInscricaoRepository.findAnexoUrl(anexoId)
  if (!anexo || anexo.inscricaoId !== inscricaoId) throw new AnexoNaoEncontradoError()

  const storagePath = storagePathFromUrl(anexo.url)
  if (!storagePath) throw new ArquivoInvalidoError('Caminho do arquivo inválido.')

  const url = await getSignedUrl(BUCKET, storagePath, 3600)
  return { url }
}
