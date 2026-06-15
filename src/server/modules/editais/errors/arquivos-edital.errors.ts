import { BadRequestError, NotFoundError } from '@server/lib/http/errors'

export class ArquivoEditalNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Arquivo não encontrado')
  }
}

export class ArquivoInvalidoError extends BadRequestError {
  constructor(motivo: string) {
    super(motivo)
  }
}
