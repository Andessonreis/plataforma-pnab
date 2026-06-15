import { NotFoundError } from '@server/lib/http/errors'

export class EditalContempladosNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Edital não encontrado.')
  }
}
