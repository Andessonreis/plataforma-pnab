import type { UserRole } from '@prisma/client'

/**
 * Quem opera o Memorial no painel. SUPER_ADMIN passa sozinho em requireRole,
 * por isso não precisa constar aqui; as listas abaixo servem onde não há esse atalho.
 */
export const ROLES_MEMORIAL: UserRole[] = ['ADMIN', 'COMUNICACAO']

/** Mesma lista com SUPER_ADMIN explícito (menu, transições de status, destinatários de aviso). */
export const ROLES_MEMORIAL_COMPLETO: UserRole[] = [...ROLES_MEMORIAL, 'SUPER_ADMIN']
