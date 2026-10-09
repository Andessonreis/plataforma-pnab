import type { listarRespostas } from '@/lib/services/questionario-resposta.service'
import type { CampoFormulario } from '@/types/campo-formulario'

export type Resposta = Awaited<ReturnType<typeof listarRespostas>>['data'][number]

export const snapshotDe = (r: Resposta) => r.camposSnapshot as unknown as CampoFormulario[]
export const dadosDe = (r: Resposta) => (r.dados ?? {}) as Record<string, unknown>
