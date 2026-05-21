import { cookies } from 'next/headers'
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from './jwt'

export const ACCESS_TOKEN_COOKIE = 'pnab.access'
export const REFRESH_TOKEN_COOKIE = 'pnab.refresh'

function commonOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const store = await cookies()
  store.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...commonOptions(),
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  })
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...commonOptions(),
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  })
}

export async function clearAuthCookies() {
  const store = await cookies()
  store.delete(ACCESS_TOKEN_COOKIE)
  store.delete(REFRESH_TOKEN_COOKIE)
}

export async function readAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export async function readRefreshToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}
