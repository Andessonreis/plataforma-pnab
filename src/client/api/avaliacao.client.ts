import type { AvaliacaoSalvaDTO } from '@shared/dtos/avaliacao.dto'
import type { AvaliacaoInput } from '@shared/schemas/avaliacao.schema'
import { unwrap } from './_http'

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
