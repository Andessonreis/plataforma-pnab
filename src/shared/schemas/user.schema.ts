import { z } from 'zod'

const passwordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos um caractere especial')

export const registerSchema = z.object({
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
  password: passwordSchema,
  tipoProponente: z.enum(['PF', 'PJ', 'MEI', 'COLETIVO']),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  cpfCnpj: z.string().min(1, 'CPF/CNPJ obrigatório').optional(),
  email: z.string().email('E-mail inválido').optional(),
}).refine(
  (data) => data.cpfCnpj || data.email,
  { message: 'Informe o CPF/CNPJ ou e-mail.' },
)

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  password: passwordSchema,
})

export const updateProfileSchema = z.object({
  nome: z.string().min(3).optional(),
  telefone: z.string().optional(),
  cep: z.string().min(8).max(8).optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2).optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
