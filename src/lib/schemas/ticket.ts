import { z } from 'zod'

export const createTicketSchema = z.object({
  nomeContato: z.string().min(2, 'Nome é obrigatório'),
  emailContato: z.string().email('E-mail inválido'),
  assunto: z.string().min(3, 'Assunto é obrigatório'),
  mensagem: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
  editalId: z.string().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

export const updateTicketSchema = z.object({
  status: z.enum(['ABERTO', 'EM_ATENDIMENTO', 'FECHADO']).optional(),
  resposta: z.string().optional(),
})

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>

export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(15),
  status: z.enum(['ABERTO', 'EM_ATENDIMENTO', 'FECHADO']).optional(),
})
