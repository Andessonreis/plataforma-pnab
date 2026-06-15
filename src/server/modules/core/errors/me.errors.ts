import { NotFoundError } from '@server/lib/http/errors'

export class UsuarioNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Usuário não encontrado.')
  }
}
