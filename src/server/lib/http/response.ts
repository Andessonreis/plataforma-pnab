import { NextResponse } from 'next/server'
import type {
  ErrorResponse,
  PaginationMeta,
  SuccessResponse,
} from '@shared/dtos/common.dto'

type SuccessInit = {
  status?: number
  requestId: string
  cacheControl?: string
  meta?: PaginationMeta
}

export function jsonSuccess<T>(data: T, init: SuccessInit): NextResponse<SuccessResponse<T>> {
  const body: SuccessResponse<T> = { data, requestId: init.requestId }
  if (init.meta) body.meta = init.meta

  const res = NextResponse.json(body, { status: init.status ?? 200 })
  res.headers.set('X-Request-Id', init.requestId)
  res.headers.set('Cache-Control', init.cacheControl ?? 'no-store')
  return res
}

type ErrorInit = {
  status: number
  requestId: string
  code: string
  message: string
  details?: unknown
}

export function jsonError(init: ErrorInit): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    error: init.code,
    message: init.message,
    requestId: init.requestId,
  }
  if (init.details !== undefined) body.details = init.details

  const res = NextResponse.json(body, { status: init.status })
  res.headers.set('X-Request-Id', init.requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
