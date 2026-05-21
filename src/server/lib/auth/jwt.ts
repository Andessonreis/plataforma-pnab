import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '@prisma/client'

const ISSUER = 'plataforma-pnab'
const AUDIENCE = 'plataforma-pnab-web'

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60                  // 1h
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30       // 30 dias

export type AccessTokenClaims = {
  sub: string
  role: UserRole
  email: string
  nome: string
}

export type RefreshTokenClaims = {
  sub: string
  jti: string
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET não configurado')
  return new TextEncoder().encode(secret)
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({
    role: claims.role,
    email: claims.email,
    nome: claims.nome,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function signRefreshToken(claims: RefreshTokenClaims): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    if (!payload.sub) return null
    return {
      sub: payload.sub,
      role: payload.role as UserRole,
      email: payload.email as string,
      nome: payload.nome as string,
    }
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    if (!payload.sub || !payload.jti) return null
    return { sub: payload.sub, jti: payload.jti }
  } catch {
    return null
  }
}
