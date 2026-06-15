import bcrypt from 'bcryptjs'
import type { Prisma } from '@prisma/client'
import { logAudit } from '@/lib/audit'
import type { UpdateProfileInput } from '@/lib/schemas/user'
import { BadRequestError } from '@server/lib/http/errors'
import { meRepository } from '../repository/me.repository'
import { UsuarioNaoEncontradoError } from '../errors/me.errors'

export function getProfile(userId: string) {
  return meRepository.findProfile(userId)
}

export async function updateProfile(userId: string, data: UpdateProfileInput, ip?: string) {
  const updateData: Record<string, unknown> = {}

  if (data.nome) updateData.nome = data.nome
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
