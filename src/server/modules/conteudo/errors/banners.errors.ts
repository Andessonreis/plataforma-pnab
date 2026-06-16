import { NotFoundError } from '@server/lib/http/errors'

export class BannerNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Banner não encontrado.')
  }
}
