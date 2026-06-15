import bcrypt from 'bcryptjs'
import { logAudit, AUDIT_ACTIONS } from '@server/lib/audit'
import { ConflictError } from '@server/lib/http/errors'
import type { RegisterInput } from '@shared/schemas/user.schema'
import { registroRepository } from '../repository/registro.repository'

export async function register(data: RegisterInput, ip?: string) {
  const existing = await registroRepository.findByCpfOrEmail(data.cpfCnpj, data.email)
  if (existing) {
    const campo = existing.cpfCnpj === data.cpfCnpj ? 'CPF/CNPJ' : 'E-mail'
    throw new ConflictError(`${campo} já cadastrado.`)
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  const user = await registroRepository.create({
    nome: data.nome,
    cpfCnpj: data.cpfCnpj,
    email: data.email,
    telefone: data.telefone ?? null,
    cep: data.cep,
    logradouro: data.logradouro,
    numero: data.numero ?? null,
    complemento: data.complemento ?? null,
    bairro: data.bairro,
    cidade: data.cidade,
    uf: data.uf,
    password: hashedPassword,
    tipoProponente: data.tipoProponente,
    role: 'PROPONENTE',
  })

  await logAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.CADASTRO,
    entity: 'User',
    entityId: user.id,
    details: { tipoProponente: data.tipoProponente },
    ip,
  })

  return { userId: user.id }
}
