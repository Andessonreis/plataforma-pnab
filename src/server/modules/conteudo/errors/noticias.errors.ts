import { NotFoundError } from '@server/lib/http/errors'

export class NoticiaNaoEncontradaError extends NotFoundError {
  constructor() {
    super('Notícia não encontrada.')
  }
}
