import { z } from 'zod'
import { paginationSchema } from './pagination'
import { STATUS_CONTEUDO } from '@/lib/memorial/rotulos'

/** Texto opcional do formulário: vazio vira `null`, para não gravar string em branco. */
export function textoOpcional(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .nullish()
    .transform((v) => (v ? v : null))
}

export const slugSchema = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use só letras minúsculas, números e hífens')
  .optional()
  .or(z.literal('').transform(() => undefined))

/** Arquivo enviado pelo upload do Memorial (/api/arquivos/...) ou link https externo. */
export const urlArquivoSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/api/arquivos/') || v.startsWith('https://'), {
    message: 'Endereço de arquivo inválido',
  })
  .nullish()
  .transform((v) => (v ? v : null))

/** Lista de ids para vínculos M:N. Ausente = não mexe; lista (mesmo vazia) = substitui. */
export const idsSchema = z.array(z.string().min(1).max(40)).max(300).optional()

export const anoSchema = z.number().int().min(1500).max(2100).nullish().transform((v) => v ?? null)

export const statusConteudoSchema = z.enum(STATUS_CONTEUDO)

export const transicaoSchema = z.object({ status: statusConteudoSchema })

export const listagemAdminSchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  status: statusConteudoSchema.optional(),
})

export type ListagemAdmin = z.infer<typeof listagemAdminSchema>
