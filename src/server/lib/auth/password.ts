import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2'
import bcrypt from 'bcryptjs'

const ARGON2_PREFIX = '$argon2'

export type HashKind = 'argon2id' | 'bcrypt'

export function detectHashKind(stored: string): HashKind {
  return stored.startsWith(ARGON2_PREFIX) ? 'argon2id' : 'bcrypt'
}

export async function hashPassword(password: string): Promise<string> {
  return argon2Hash(password, {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  })
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const kind = detectHashKind(stored)
  if (kind === 'argon2id') {
    try {
      return await argon2Verify(stored, plain)
    } catch {
      return false
    }
  }
  return bcrypt.compare(plain, stored)
}

export function needsRehash(stored: string): boolean {
  return detectHashKind(stored) !== 'argon2id'
}
