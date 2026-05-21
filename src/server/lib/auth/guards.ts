import type { UserRole } from '@prisma/client'
import { ForbiddenError, UnauthorizedError } from '@server/lib/http/errors'
import type { CurrentUser } from './current-user'
import { getCurrentUserFromHeaders } from './current-user'

export async function requireAuth(headers: Headers): Promise<CurrentUser> {
  const user = await getCurrentUserFromHeaders(headers)
  if (!user) throw new UnauthorizedError()
  return user
}

export async function requireRole(headers: Headers, ...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireAuth(headers)
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`Necessária role ${roles.join(' ou ')}`)
  }
  return user
}

export async function requireProponente(headers: Headers): Promise<CurrentUser> {
  return requireRole(headers, 'PROPONENTE')
}

export async function requireAdmin(headers: Headers): Promise<CurrentUser> {
  return requireRole(headers, 'ADMIN', 'ATENDIMENTO', 'HABILITADOR')
}

export async function requireAvaliador(headers: Headers): Promise<CurrentUser> {
  return requireRole(headers, 'AVALIADOR')
}
