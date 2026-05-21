import type { UserRole } from '@shared/enums/user-role'

export type SessaoDTO = {
  usuario: {
    id: string
    email: string
    nome: string
    role: UserRole
  }
  expiraEm: string
}
