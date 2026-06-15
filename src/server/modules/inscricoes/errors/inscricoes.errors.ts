import { NotFoundError } from '@server/lib/http/errors'

export class InscricaoNaoEncontradaError extends NotFoundError {
  constructor() {
    super('Inscrição não encontrada')
  }
}

export class EditalDaInscricaoNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Edital não encontrado')
  }
}
