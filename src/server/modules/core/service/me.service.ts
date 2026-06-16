import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { AUDIT_ACTIONS, logAudit } from '@server/lib/audit'
import type { UpdateProfileInput } from '@shared/schemas/user.schema'
import { BadRequestError } from '@server/lib/http/errors'
import { deleteFile, extractStoragePathFromUrl, uploadFile } from '@server/lib/storage'
import { meRepository } from '../repository/me.repository'
import { EmailEmUsoError, UsuarioNaoEncontradoError } from '../errors/me.errors'

const AVATAR_BUCKET = 'manuais'
const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const AVATAR_ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const AVATAR_EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function getProfile(userId: string) {
  return meRepository.findProfile(userId)
}

export async function updateProfile(userId: string, data: UpdateProfileInput, ip?: string) {
  const updateData: Record<string, unknown> = {}

  if (data.nome) updateData.nome = data.nome
  if (data.email) {
    const existing = await meRepository.findByEmailExcept(data.email, userId)
    if (existing) throw new EmailEmUsoError()
    updateData.email = data.email
  }
  if (data.cep !== undefined) updateData.cep = data.cep || null
  if (data.logradouro !== undefined) updateData.logradouro = data.logradouro || null
  if (data.numero !== undefined) updateData.numero = data.numero || null
  if (data.complemento !== undefined) updateData.complemento = data.complemento || null
  if (data.bairro !== undefined) updateData.bairro = data.bairro || null
  if (data.cidade !== undefined) updateData.cidade = data.cidade || null
  if (data.uf !== undefined) updateData.uf = data.uf || null
  if (data.telefone !== undefined) updateData.telefone = data.telefone || null

  if (data.newPassword && data.currentPassword) {
    const user = await meRepository.findPassword(userId)
    if (!user) throw new UsuarioNaoEncontradoError()

    const senhaValida = await bcrypt.compare(data.currentPassword, user.password)
    if (!senhaValida) throw new BadRequestError('Senha atual incorreta.')

    updateData.password = await bcrypt.hash(data.newPassword, 12)
  }

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError('Nenhum dado para atualizar.')
  }

  await meRepository.update(userId, updateData as Prisma.UserUpdateInput)

  await logAudit({
    userId,
    action: 'PERFIL_ATUALIZADO',
    entity: 'User',
    entityId: userId,
    details: { fields: Object.keys(updateData).filter((k) => k !== 'password') },
    ip,
  })
}

export async function updateAvatar(
  userId: string,
  file: { size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer> },
  ip?: string,
) {
  if (file.size > AVATAR_MAX_BYTES) {
    throw new BadRequestError(
      `Imagem maior que 2 MB. Atual: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
    )
  }
  if (!AVATAR_ALLOWED_MIME.has(file.type)) {
    throw new BadRequestError('Formato não suportado. Use JPG, PNG ou WEBP.')
  }

  const current = await meRepository.findAvatar(userId)
  const oldPath = current?.avatarUrl
    ? extractStoragePathFromUrl(current.avatarUrl, AVATAR_BUCKET)
    : undefined
  if (oldPath) {
    await deleteFile(AVATAR_BUCKET, oldPath).catch((err) => {
      console.warn('[avatar] falha ao remover antigo:', err)
    })
  }

  const ext = AVATAR_EXT_BY_MIME[file.type]
  const path = `avatars/${userId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(AVATAR_BUCKET, path, buffer, file.type)

  await meRepository.updateAvatar(userId, url)

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.PERFIL_ATUALIZADO,
    entity: 'User',
    entityId: userId,
    details: { field: 'avatarUrl' },
    ip,
  })

  return { avatarUrl: url }
}

export async function removeAvatar(userId: string, ip?: string) {
  const current = await meRepository.findAvatar(userId)
  const path = current?.avatarUrl
    ? extractStoragePathFromUrl(current.avatarUrl, AVATAR_BUCKET)
    : undefined
  if (path) {
    await deleteFile(AVATAR_BUCKET, path).catch((err) => {
      console.warn('[avatar] falha ao remover:', err)
    })
  }

  await meRepository.updateAvatar(userId, null)

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.PERFIL_ATUALIZADO,
    entity: 'User',
    entityId: userId,
    details: { field: 'avatarUrl', removed: true },
    ip,
  })
}
