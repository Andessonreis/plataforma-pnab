import { ConflictError, NotFoundError } from '@server/lib/http/errors'

export class UsuarioNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Usuário não encontrado.')
  }
}

export class EmailEmUsoError extends ConflictError {
  constructor() {
    super('Este e-mail já está em uso.')
  }
}
