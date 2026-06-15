import type { HabilitacaoInput } from '@shared/schemas/habilitacao.schema'
import { unwrap } from './_http'

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
