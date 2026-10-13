import type { CampoFormulario } from '@/types/campo-formulario'

type ComSnapshot = { camposSnapshot: unknown; dados: unknown }

export type { Resposta } from './carregar'

export const snapshotDe = (r: ComSnapshot) => r.camposSnapshot as unknown as CampoFormulario[]
export const dadosDe = (r: ComSnapshot) => (r.dados ?? {}) as Record<string, unknown>
