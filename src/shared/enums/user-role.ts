export const USER_ROLES = ['PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]
