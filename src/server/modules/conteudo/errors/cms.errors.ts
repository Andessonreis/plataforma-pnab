import { NotFoundError } from '@server/lib/http/errors'

export class CmsPaginaNaoEncontradaError extends NotFoundError {
  constructor() {
    super('Página não encontrada.')
  }
}
