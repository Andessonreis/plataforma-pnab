import type { UserRole } from '@shared/enums/user-role'

export type UsuarioDTO = {
  id: string
  nome: string
  email: string
  cpfCnpj: string | null
  role: UserRole
  tipoProponente: string | null
  ativo: boolean
}

export type CadastroResultDTO = {
  usuario: { id: string; email: string; nome: string }
  mensagem: string
}

export type GenericMessageDTO = {
  mensagem: string
}

export type BuscaUsuarioDTO = {
  id: string
  nome: string
  email: string
  cpfCnpj: string | null
  tipoProponente: string | null
  role: UserRole
}
