import { z } from 'zod'

export const funcaoEditalSchema = z.enum(['AVALIADOR', 'HABILITADOR'])
export type FuncaoEdital = z.infer<typeof funcaoEditalSchema>

export const equipeAddInputSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'Informe ao menos um usuário'),
  funcao: funcaoEditalSchema,
})
export type EquipeAddInput = z.infer<typeof equipeAddInputSchema>

export const equipeRemoveInputSchema = z.object({
  userId: z.string().min(1),
  funcao: funcaoEditalSchema,
})
export type EquipeRemoveInput = z.infer<typeof equipeRemoveInputSchema>
