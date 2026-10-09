import { z } from 'zod'
import { camposFormularioSchema } from './campo-formulario'
import { paginationSchema } from './pagination'
import { STATUS_CONTEUDO } from '@/lib/memorial/rotulos'

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const questionarioSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, 'Endereço deve ter no mínimo 3 caracteres.')
    .max(80, 'Endereço deve ter no máximo 80 caracteres.')
    .regex(KEBAB, 'Endereço aceita só letras minúsculas, números e hífens (ex.: pesquisa-de-visita).'),
  titulo: z.string().trim().min(3, 'Título deve ter no mínimo 3 caracteres.').max(160),
  descricao: z.string().trim().max(2000).nullable().optional(),
  finalidade: z
    .string()
    .trim()
    .min(2, 'Informe a finalidade.')
    .max(80)
    .regex(KEBAB, 'Finalidade aceita só letras minúsculas, números e hífens (ex.: memorial-agendamento).'),
  campos: camposFormularioSchema,
  /** Ausente mantém a situação atual (o painel publica e arquiva por PATCH); na criação vale RASCUNHO. */
  status: z.enum(STATUS_CONTEUDO).optional(),
  exigeLogin: z.boolean().default(false),
  mensagemSucesso: z.string().trim().max(1000).nullable().optional(),
})

export type QuestionarioInput = z.infer<typeof questionarioSchema>

export const listarQuestionariosSchema = paginationSchema.extend({
  status: z.enum(STATUS_CONTEUDO).optional(),
  finalidade: z.string().trim().max(80).optional(),
  busca: z.string().trim().max(120).optional(),
})

export type ListarQuestionariosInput = z.infer<typeof listarQuestionariosSchema>

export const alterarStatusSchema = z.object({ status: z.enum(STATUS_CONTEUDO) })

export const listarRespostasSchema = paginationSchema.extend({
  formato: z.enum(['json', 'csv']).default('json'),
})

/** Corpo do envio público: as respostas em si são validadas depois, pelos campos do questionário. */
export const envioRespostaSchema = z.object({
  dados: z.record(z.string(), z.unknown()),
  nome: z.string().trim().max(200).optional(),
  email: z.string().trim().email('E-mail inválido.').max(200).optional().or(z.literal('')),
})

export type EnvioRespostaInput = z.infer<typeof envioRespostaSchema>
