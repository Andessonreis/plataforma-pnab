import type { HabilitacaoInput } from '@shared/schemas/habilitacao.schema'

type ApiSuccess<T> = { data: T; requestId: string }
type ApiError = { error: string; message: string; requestId: string }

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(err?.message ?? `Erro ${res.status}`)
  }
  const body = (await res.json()) as ApiSuccess<T>
  return body.data
}

const BASE = '/api/v1/inscricoes/inscricao'

export const habilitacaoClient = {
  async decide(inscricaoId: string, input: HabilitacaoInput): Promise<{ mensagem: string }> {
    const res = await fetch(`${BASE}/${inscricaoId}/habilitacao`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<{ mensagem: string }>(res)
  },
}
