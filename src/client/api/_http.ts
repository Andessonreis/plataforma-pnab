import type { PaginationMeta } from '@shared/dtos/common.dto'

export type ApiSuccess<T> = { data: T; meta?: PaginationMeta; requestId: string }
export type ApiError = {
  error: string
  message: string
  requestId: string
  details?: unknown
}

export async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(err?.message ?? `Erro ${res.status}`)
  }
  const body = (await res.json()) as ApiSuccess<T>
  return body.data
}

export async function unwrapWithMeta<T>(
  res: Response,
): Promise<{ data: T; meta?: PaginationMeta }> {
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(err?.message ?? `Erro ${res.status}`)
  }
  const body = (await res.json()) as ApiSuccess<T>
  return { data: body.data, meta: body.meta }
}
