import { z } from 'zod'
import { PREFIXO_URL } from '@/lib/storage/paths'
import { paginationSchema } from './pagination'

const PREFIXO_MANUAIS = `${PREFIXO_URL}/manuais/`

/**
 * Só a URL relativa que a rota de upload devolve. Link externo ou com host é recusado:
 * a página pública abre esse endereço direto.
 */
const urlDoManual = z
  .string({ required_error: 'Envie o arquivo do documento.' })
  .min(1, 'Envie o arquivo do documento.')
  .refine(
    (url) => url.startsWith(PREFIXO_MANUAIS) && url.length > PREFIXO_MANUAIS.length && !/[?#\\]|\.\./.test(url),
    'Arquivo inválido. Envie o documento de novo.',
  )

export const manualSchema = z.object({
  titulo: z.string().trim().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título deve ter no máximo 200 caracteres'),
  categoria: z.string().trim().min(2, 'Informe a categoria').max(80, 'Categoria deve ter no máximo 80 caracteres'),
  versao: z
    .string()
    .trim()
    .max(20, 'Versão deve ter no máximo 20 caracteres')
    .nullish()
    .transform((v) => v || null),
  publicado: z.boolean().default(true),
  url: urlDoManual,
})

export type ManualInput = z.infer<typeof manualSchema>

export const STATUS_MANUAL = ['publicado', 'oculto'] as const
export type StatusManual = (typeof STATUS_MANUAL)[number]

export const listagemManuaisSchema = paginationSchema.extend({
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(STATUS_MANUAL).optional().catch(undefined),
})

export type ListagemManuais = z.infer<typeof listagemManuaisSchema>
