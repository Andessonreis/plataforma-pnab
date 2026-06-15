import { UnauthorizedError } from '@server/lib/http/errors'

export class CredenciaisInvalidasError extends UnauthorizedError {
  constructor() {
    super('CPF/CNPJ ou senha inválidos')
  }
}

export class UsuarioInativoError extends UnauthorizedError {
  constructor() {
    super('Usuário inativo')
  }
}

export class RefreshTokenInvalidoError extends UnauthorizedError {
  constructor() {
    super('Sessão expirada ou inválida')
  }
}
