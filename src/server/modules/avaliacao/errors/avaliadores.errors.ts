import { ApiError, BadRequestError, NotFoundError, UnprocessableEntityError } from '@server/lib/http/errors'

export class ForaDaFaseError extends ApiError {
  constructor(mensagem: string) {
    super('FORA_DA_FASE', mensagem, 422)
  }
}

export class AvaliadoresInvalidosError extends BadRequestError {
  constructor() {
    super('Um ou mais avaliadores inválidos.')
  }
}

export class StatusInscricaoInvalidoError extends BadRequestError {
  constructor() {
    super('Inscrição deve estar HABILITADA ou EM_AVALIACAO.')
  }
}

export class AvaliacaoNaoEncontradaError extends NotFoundError {
  constructor() {
    super('Avaliação não encontrada')
  }
}

export class AvaliacaoFinalizadaError extends UnprocessableEntityError {
  constructor() {
    super('Não é possível remover avaliação já finalizada.')
  }
}
