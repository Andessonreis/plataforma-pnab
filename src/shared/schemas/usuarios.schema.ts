import { z } from 'zod'

export const tipoProponenteSchema = z.enum(['PF', 'PJ', 'MEI', 'COLETIVO'])

export const cadastroInputSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpfCnpj: z.string().min(11).max(14),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  cep: z.string().min(8, 'CEP inválido').max(8),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  uf: z.string().length(2, 'UF inválida'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  tipoProponente: tipoProponenteSchema,
})

export type CadastroInput = z.infer<typeof cadastroInputSchema>

export const recuperacaoSenhaInputSchema = z
  .object({
    cpfCnpj: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => Boolean(data.cpfCnpj || data.email), {
    message: 'Informe CPF/CNPJ ou e-mail',
  })

export type RecuperacaoSenhaInput = z.infer<typeof recuperacaoSenhaInputSchema>

export const redefinicaoSenhaInputSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export type RedefinicaoSenhaInput = z.infer<typeof redefinicaoSenhaInputSchema>

export const buscaUsuariosInputSchema = z.object({
  q: z.string().trim().min(2).max(120).optional(),
  ids: z.string().trim().min(1).max(2000).optional(),
  role: z.enum(['PROPONENTE', 'ATENDIMENTO', 'HABILITADOR', 'AVALIADOR', 'ADMIN']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type BuscaUsuariosInput = z.infer<typeof buscaUsuariosInputSchema>
