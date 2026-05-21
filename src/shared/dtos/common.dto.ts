export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type SuccessResponse<T> = {
  data: T
  meta?: PaginationMeta
  requestId: string
}

export type ErrorResponse = {
  error: string
  message: string
  requestId: string
  details?: unknown
}
