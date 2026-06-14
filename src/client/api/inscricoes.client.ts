import type {
  InscricaoAnexoDTO,
  InscricaoCriacaoDTO,
  InscricaoDetalheDTO,
  InscricaoEnvioDTO,
} from '@shared/dtos/inscricoes.dto'
import type { CreateInscricaoInput, UpdateInscricaoInput } from '@shared/schemas/inscricoes.schema'
import type { AnexoUploadMeta } from '@shared/schemas/anexos-inscricao.schema'

type ApiSuccess<T> = { data: T; requestId: string }
type ApiError = { error: string; message: string; requestId: string; details?: unknown }

export class InscricaoDuplicadaError extends Error {
  constructor(
    message: string,
    public readonly inscricaoId: string,
  ) {
    super(message)
    this.name = 'InscricaoDuplicadaError'
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiError | null
    throw new Error(err?.message ?? `Erro ${res.status}`)
  }
  const body = (await res.json()) as ApiSuccess<T>
  return body.data
}

const BASE = '/api/v1/inscricoes/inscricao'

export const inscricoesClient = {
  async create(input: CreateInscricaoInput): Promise<InscricaoCriacaoDTO> {
    const res = await fetch(`${BASE}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as ApiError | null
      const dupId = (err?.details as { inscricaoId?: string } | undefined)?.inscricaoId
      if (res.status === 409 && dupId) {
        throw new InscricaoDuplicadaError(err?.message ?? 'Inscrição já existe', dupId)
      }
      throw new Error(err?.message ?? `Erro ${res.status}`)
    }
    const body = (await res.json()) as ApiSuccess<InscricaoCriacaoDTO>
    return body.data
  },

  async update(id: string, input: UpdateInscricaoInput): Promise<InscricaoDetalheDTO> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<InscricaoDetalheDTO>(res)
  },

  async submit(id: string): Promise<InscricaoEnvioDTO> {
    const res = await fetch(`${BASE}/${id}/submit`, { method: 'POST', credentials: 'same-origin' })
    return unwrap<InscricaoEnvioDTO>(res)
  },

  async retract(id: string): Promise<{ mensagem: string }> {
    const res = await fetch(`${BASE}/${id}/retract`, { method: 'POST', credentials: 'same-origin' })
    return unwrap<{ mensagem: string }>(res)
  },

  async uploadAnexo(id: string, file: File, meta: AnexoUploadMeta): Promise<InscricaoAnexoDTO> {
    const form = new FormData()
    form.append('file', file)
    form.append('tipo', meta.tipo)
    form.append('titulo', meta.titulo)
    const res = await fetch(`${BASE}/${id}/anexos/anexo`, {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    })
    return unwrap<InscricaoAnexoDTO>(res)
  },

  async removeAnexo(id: string, anexoId: string): Promise<{ mensagem: string }> {
    const res = await fetch(`${BASE}/${id}/anexos/anexo/${anexoId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    return unwrap<{ mensagem: string }>(res)
  },

  async anexoSignedUrl(id: string, anexoId: string): Promise<{ url: string }> {
    const res = await fetch(`${BASE}/${id}/anexos/anexo/${anexoId}/url`, { credentials: 'same-origin' })
    return unwrap<{ url: string }>(res)
  },
}
