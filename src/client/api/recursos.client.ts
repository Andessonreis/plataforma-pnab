import type { ConsolidacaoEstado, RecursoDTO } from '@shared/dtos/recursos.dto'
import type {
  DecidirRecursoInput,
  ResponderRecursoInput,
  SubmeterRecursoInput,
} from '@shared/schemas/recursos.schema'
import { unwrap } from './_http'

const BASE = '/api/v1/inscricoes/inscricao'

export const recursosClient = {
  async submit(inscricaoId: string, input: SubmeterRecursoInput): Promise<RecursoDTO> {
    const res = await fetch(`${BASE}/${inscricaoId}/recursos/recurso`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<RecursoDTO>(res)
  },

  async decide(
    inscricaoId: string,
    recursoId: string,
    input: DecidirRecursoInput,
  ): Promise<{ mensagem: string }> {
    const res = await fetch(`${BASE}/${inscricaoId}/recursos/recurso/${recursoId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<{ mensagem: string }>(res)
  },

  async respond(
    inscricaoId: string,
    recursoId: string,
    input: ResponderRecursoInput,
  ): Promise<{ estado: ConsolidacaoEstado }> {
    const res = await fetch(`${BASE}/${inscricaoId}/recursos/recurso/${recursoId}/respostas`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    })
    return unwrap<{ estado: ConsolidacaoEstado }>(res)
  },

  async uploadAnexo(inscricaoId: string, file: File): Promise<{ url: string; filename: string }> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/${inscricaoId}/recursos/anexos`, {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    })
    return unwrap<{ url: string; filename: string }>(res)
  },

  async anexoSignedUrl(inscricaoId: string, recursoId: string, url: string): Promise<{ url: string }> {
    const res = await fetch(
      `${BASE}/${inscricaoId}/recursos/recurso/${recursoId}/anexos?url=${encodeURIComponent(url)}`,
      { credentials: 'same-origin' },
    )
    return unwrap<{ url: string }>(res)
  },
}
