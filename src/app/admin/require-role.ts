import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole } from '@prisma/client'

/**
 * Verifica se o usuário autenticado tem uma das roles permitidas.
 * Redireciona para /admin se não tiver permissão.
 * Deve ser chamado no início de cada page.tsx do admin.
 */
export async function requireRole(...allowedRoles: UserRole[]) {
  const session = await auth()
  if (!session) redirect('/login')

  const role = session.user.role as UserRole
  if (!allowedRoles.includes(role)) {
    redirect('/admin')
  }

  return session
}
