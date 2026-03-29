import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { ZodError } from 'zod'
import { ServiceError } from '@/lib/services/errors'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos do envelope padrão
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiContext {
  requestId: string
  start: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Cria contexto de requisição (requestId + timer)
// ─────────────────────────────────────────────────────────────────────────────

export function createContext(): ApiContext {
  return { requestId: randomUUID(), start: Date.now() }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper interno — monta response com headers padrão
// ─────────────────────────────────────────────────────────────────────────────

function buildResponse(
  body: Record<string, unknown>,
  status: number,
  ctx: ApiContext,
  cache: string = 'no-store',
): NextResponse {
  const res = NextResponse.json(body, { status })
  res.headers.set('X-Request-Id', ctx.requestId)
  res.headers.set('Cache-Control', cache)
  return res
}

// ─────────────────────────────────────────────────────────────────────────────
// Respostas de sucesso
// ─────────────────────────────────────────────────────────────────────────────

export function ok<T>(ctx: ApiContext, data: T, cache?: string): NextResponse {
  return buildResponse(
    { data, requestId: ctx.requestId },
    200,
    ctx,
    cache,
  )
}

export function okPaginated<T>(
  ctx: ApiContext,
  data: T[],
  meta: ApiMeta,
  cache?: string,
): NextResponse {
  return buildResponse(
    { data, meta, requestId: ctx.requestId },
    200,
    ctx,
    cache,
  )
}

export function created<T>(ctx: ApiContext, data: T): NextResponse {
  return buildResponse(
    { data, requestId: ctx.requestId },
    201,
    ctx,
  )
}

export function noContent(ctx: ApiContext): NextResponse {
  const res = new NextResponse(null, { status: 204 })
  res.headers.set('X-Request-Id', ctx.requestId)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

// ─────────────────────────────────────────────────────────────────────────────
// Respostas de erro
// ─────────────────────────────────────────────────────────────────────────────

export function badRequest(ctx: ApiContext, message = 'Requisição inválida.'): NextResponse {
  return buildResponse(
    { error: 'BAD_REQUEST', message, requestId: ctx.requestId },
    400,
    ctx,
  )
}

export function unauthorized(ctx: ApiContext, message = 'Não autenticado.'): NextResponse {
  return buildResponse(
    { error: 'UNAUTHORIZED', message, requestId: ctx.requestId },
    401,
    ctx,
  )
}

export function forbidden(ctx: ApiContext, message = 'Acesso negado.'): NextResponse {
  return buildResponse(
    { error: 'FORBIDDEN', message, requestId: ctx.requestId },
    403,
    ctx,
  )
}

export function notFound(ctx: ApiContext, message = 'Recurso não encontrado.'): NextResponse {
  return buildResponse(
    { error: 'NOT_FOUND', message, requestId: ctx.requestId },
    404,
    ctx,
  )
}

export function conflict(ctx: ApiContext, message = 'Conflito com recurso existente.'): NextResponse {
  return buildResponse(
    { error: 'CONFLICT', message, requestId: ctx.requestId },
    409,
    ctx,
  )
}

export function validationError(ctx: ApiContext, err: ZodError): NextResponse {
  const fieldErrors: Record<string, string> = {}
  for (const e of err.errors) {
    fieldErrors[e.path.join('.')] = e.message
  }
  return buildResponse(
    { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', fieldErrors, requestId: ctx.requestId },
    400,
    ctx,
  )
}

export function internalError(ctx: ApiContext, message = 'Erro interno.'): NextResponse {
  return buildResponse(
    { error: 'INTERNAL_ERROR', message, requestId: ctx.requestId },
    500,
    ctx,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Converte ServiceError → HTTP response
// ─────────────────────────────────────────────────────────────────────────────

export function serviceErrorResponse(ctx: ApiContext, err: ServiceError): NextResponse {
  return buildResponse(
    { error: err.code, message: err.message, requestId: ctx.requestId },
    err.httpStatus,
    ctx,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler genérico de erros (catch-all)
// ─────────────────────────────────────────────────────────────────────────────

export function handleError(ctx: ApiContext, err: unknown): NextResponse {
  if (err instanceof ZodError) return validationError(ctx, err)
  if (err instanceof ServiceError) return serviceErrorResponse(ctx, err)

  console.error({ requestId: ctx.requestId, error: err instanceof Error ? err.message : 'Unknown' })
  return internalError(ctx)
}

// ─────────────────────────────────────────────────────────────────────────────
// Log de requisição (helper)
// ─────────────────────────────────────────────────────────────────────────────

export function logRequest(ctx: ApiContext, method: string, path: string, status: number): void {
  console.log({
    requestId: ctx.requestId,
    method,
    path,
    status,
    durationMs: Date.now() - ctx.start,
  })
}
