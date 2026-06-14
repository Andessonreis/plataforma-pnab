import type { AvaliacaoSalvaDTO } from '@shared/dtos/avaliacao.dto'
import type { AvaliacaoInput } from '@shared/schemas/avaliacao.schema'

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

export const avaliacaoClient = {
  async save(inscricaoId: string, input: AvaliacaoInput): Promise<AvaliacaoSalvaDTO> {
    const res = await fetch(`${BASE}/${inscricaoId}/avaliacao`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<AvaliacaoSalvaDTO>(res)
  },
}
