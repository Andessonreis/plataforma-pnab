import { NotFoundError, ForbiddenError, ConflictError } from '@server/lib/http/errors'

export class ApiKeyNaoEncontradaError extends NotFoundError {
  constructor() {
    super('API key não encontrada.')
  }
}

export class ApiKeyAcessoNegadoError extends ForbiddenError {
  constructor() {
    super('Acesso negado.')
  }
}

export class ApiKeyJaRevogadaError extends ConflictError {
  constructor() {
    super('Esta API key já foi revogada.')
  }
}
