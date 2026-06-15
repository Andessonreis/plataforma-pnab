// ─────────────────────────────────────────────────────────────────────────────
// Códigos de erro do service layer
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'LOCKED'
  | 'UNAUTHORIZED'

const HTTP_STATUS_MAP: Record<ServiceErrorCode, number> = {
  NOT_FOUND: 404,
  CONFLICT: 409,
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
  LOCKED: 422,
  UNAUTHORIZED: 401,
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceError — lançada pelos services, convertida em HTTP nos handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ServiceError extends Error {
  public readonly code: ServiceErrorCode
  public readonly httpStatus: number

  constructor(code: ServiceErrorCode, message: string) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.httpStatus = HTTP_STATUS_MAP[code]
  }
}
