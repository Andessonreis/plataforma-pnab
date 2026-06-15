import { randomBytes, createHmac } from 'crypto'
import { apiKeysRepository } from '../repository/api-keys.repository'
import {
  ApiKeyNaoEncontradaError,
  ApiKeyAcessoNegadoError,
  ApiKeyJaRevogadaError,
} from '../errors/api-keys.errors'

const KEY_PREFIX = 'pnab_'

function hmacKey(rawKey: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não configurado')
  return createHmac('sha256', secret).update(rawKey).digest('hex')
}

export async function createApiKey(userId: string, label: string, scopes: string[] = [], expiresAt?: Date) {
  const rawKey = `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`
  const keyHash = hmacKey(rawKey)
  const prefix = rawKey.slice(0, 12)

  const apiKey = await apiKeysRepository.create({
    userId,
    label,
    keyHash,
    prefix,
    scopes,
    expiresAt: expiresAt ?? null,
  })

  // rawKey é retornado apenas uma vez (como GitHub tokens)
  return {
    id: apiKey.id,
    key: rawKey,
    prefix: apiKey.prefix,
    label: apiKey.label,
    scopes: apiKey.scopes,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  }
}

export async function revokeApiKey(id: string, userId: string) {
  const apiKey = await apiKeysRepository.findById(id)
  if (!apiKey) throw new ApiKeyNaoEncontradaError()
  if (apiKey.userId !== userId) throw new ApiKeyAcessoNegadoError()
  if (apiKey.revokedAt) throw new ApiKeyJaRevogadaError()

  await apiKeysRepository.revoke(id, new Date())
}

export function listApiKeys(userId: string) {
  return apiKeysRepository.listByUser(userId)
}
