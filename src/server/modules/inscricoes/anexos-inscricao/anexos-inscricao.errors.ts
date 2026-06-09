import { BadRequestError, NotFoundError } from '@server/lib/http/errors'

export class AnexoNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Anexo não encontrado')
  }
}

export class ArquivoInvalidoError extends BadRequestError {
  constructor(mensagem: string) {
    super(mensagem)
  }
}
