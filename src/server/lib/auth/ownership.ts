import type { UserRole } from '@prisma/client'

/**
 * Roles internas da Secretaria (não-proponentes) com acesso operacional
 * a inscrições e recursos.
 */
export const INTERNAL_ROLES: UserRole[] = ['ADMIN', 'HABILITADOR', 'AVALIADOR', 'ATENDIMENTO']

/**
 * Indica se o caller é o dono do recurso OU possui uma das roles de staff
 * informadas. Apenas a checagem booleana — cada call-site decide qual erro
 * lançar quando o acesso é negado (404 vs 403 conforme a semântica local).
 */
export function isOwnerOrStaff(
  ownerId: string,
  caller: { id: string; role: string },
  staffRoles: readonly string[],
): boolean {
  return caller.id === ownerId || staffRoles.includes(caller.role)
}
