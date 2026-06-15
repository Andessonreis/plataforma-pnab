import { ForbiddenError, UnprocessableEntityError } from '@server/lib/http/errors'

export class AvaliacaoNaoAtribuidaError extends ForbiddenError {
  constructor() {
    super('Esta inscrição não foi atribuída a você.')
  }
}

export class AvaliacaoFinalizadaError extends UnprocessableEntityError {
  constructor() {
    super('Esta avaliação já foi finalizada e não pode ser alterada.')
  }
}
