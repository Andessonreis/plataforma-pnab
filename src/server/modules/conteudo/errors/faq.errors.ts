import { NotFoundError } from '@server/lib/http/errors'

export class FaqNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Item de FAQ não encontrado.')
  }
}
