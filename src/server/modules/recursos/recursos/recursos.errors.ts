import { BadRequestError, ConflictError, NotFoundError } from '@server/lib/http/errors'

export class RecursoNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Recurso não encontrado')
  }
}

export class FaseRecursoInvalidaError extends BadRequestError {
  constructor() {
    super('Não é possível interpor recurso nesta fase.')
  }
}

export class RecursoDuplicadoError extends ConflictError {
  constructor() {
    super('Já existe um recurso para esta fase.')
  }
}

export class RecursoJaDecididoError extends ConflictError {
  constructor() {
    super('Este recurso já foi decidido.')
  }
}
