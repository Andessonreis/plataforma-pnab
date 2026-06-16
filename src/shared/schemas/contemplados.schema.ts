import { z } from 'zod'

export const VALID_STATUS_EXECUCAO = [
  'EM_EXECUCAO',
  'CONCLUIDO',
  'CANCELADO',
  'SUSPENSO',
] as const

export const importContempladosFormSchema = z.object({
  editalId: z.string().min(1, 'ID do edital é obrigatório'),
})

export const contempladoRowSchema = z.object({
  numero: z.string().min(1, 'Número da inscrição é obrigatório'),
  valorAprovado: z.coerce.number().positive('Valor deve ser positivo'),
  statusExecucao: z.string().refine(
    (val) => VALID_STATUS_EXECUCAO.includes(val as (typeof VALID_STATUS_EXECUCAO)[number]),
    { message: `Status deve ser: ${VALID_STATUS_EXECUCAO.join(', ')}` },
  ),
  contrapartida: z.string().optional(),
})

export type ContempladoRowInput = z.infer<typeof contempladoRowSchema>

export type ImportContempladosError = {
  line: number
  numero: string
  error: string
}

export type ImportContempladosResult = {
  imported: number
  errors: ImportContempladosError[]
  message: string
}
