import { NotFoundError } from '@server/lib/http/errors'

export class SlideNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Slide não encontrado.')
  }
}
