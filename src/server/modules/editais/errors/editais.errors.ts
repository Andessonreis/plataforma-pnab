import { NotFoundError } from '@server/lib/http/errors'

export class EditalNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Edital não encontrado')
  }
}
