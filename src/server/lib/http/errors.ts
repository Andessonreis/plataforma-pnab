export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Requisição inválida', details?: unknown) {
    super('BAD_REQUEST', message, 400, details)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Autenticação necessária') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Acesso negado') {
    super('FORBIDDEN', message, 403)
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Recurso não encontrado') {
    super('NOT_FOUND', message, 404)
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflito de estado', details?: unknown) {
    super('CONFLICT', message, 409, details)
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message = 'Entidade inválida', details?: unknown) {
    super('UNPROCESSABLE_ENTITY', message, 422, details)
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Muitas requisições') {
    super('TOO_MANY_REQUESTS', message, 429)
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Erro interno') {
    super('INTERNAL_ERROR', message, 500)
  }
}
