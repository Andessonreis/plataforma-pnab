import { z } from 'zod'
import { paginationSchema } from './pagination'
import {
  idsSchema,
  listagemAdminSchema,
  textoOpcional,
  urlArquivoSchema,
} from './memorial-comum'
import { TIPOS_ACERVO } from '@/lib/memorial/rotulos'

const tipoSchema = z.enum(TIPOS_ACERVO)

/** Década guardada pelo primeiro ano (1950, 1960...). */
const decadaSchema = z
  .number()
  .int()
  .min(1800)
  .max(2100)
  .refine((v) => v % 10 === 0, 'Informe a década pelo primeiro ano, ex.: 1950')

const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(30)
  .default([])
  .transform((tags) => [...new Set(tags.map((t) => t.toLowerCase()))])

export const acervoItemSchema = z.object({
  tipo: tipoSchema.default('FOTOGRAFIA'),
  titulo: z.string().trim().min(2, 'Título deve ter no mínimo 2 caracteres').max(200),
  legenda: textoOpcional(500),
  descricao: textoOpcional(20000),
  contextoHistorico: textoOpcional(20000),
  dataAproximada: textoOpcional(60),
  decada: decadaSchema.nullish().transform((v) => v ?? null),
  local: textoOpcional(200),
  autor: textoOpcional(200),
  fotografo: textoOpcional(200),
  fonte: textoOpcional(300),
  credito: textoOpcional(300),
  direitosUso: textoOpcional(1000),
  autorizado: z.boolean().default(false),
  arquivoUrl: urlArquivoSchema,
  versaoWebUrl: urlArquivoSchema,
  fotoAtualUrl: urlArquivoSchema,
  tags: tagsSchema,
  albumId: z.string().max(40).nullish().transform((v) => v || null),
  exposicaoIds: idsSchema,
  pessoaIds: idsSchema,
  eventoIds: idsSchema,
})

export type AcervoItemInput = z.infer<typeof acervoItemSchema>

/**
 * Várias fotos enviadas de uma vez. Cada uma vira um rascunho com os dados comuns
 * (álbum, crédito, direitos); o detalhamento é feito depois, foto a foto.
 */
export const acervoLoteSchema = z.object({
  arquivos: z
    .array(
      z.object({
        arquivoUrl: z.string().startsWith('/api/arquivos/memorial/').max(500),
        titulo: z.string().trim().min(1).max(200),
      }),
    )
    .min(1, 'Envie ao menos uma fotografia')
    .max(30, 'Envie no máximo 30 fotografias por vez'),
  albumId: z.string().max(40).nullish().transform((v) => v || null),
  decada: decadaSchema.nullish().transform((v) => v ?? null),
  fotografo: textoOpcional(200),
  credito: textoOpcional(300),
  direitosUso: textoOpcional(1000),
  autorizado: z.boolean().default(false),
})

export type AcervoLoteInput = z.infer<typeof acervoLoteSchema>

const decadaQuery = z.coerce.number().int().min(1800).max(2100).optional()

export const listagemAcervoAdminSchema = listagemAdminSchema.extend({
  tipo: tipoSchema.optional(),
  albumId: z.string().max(40).optional(),
  decada: decadaQuery,
})

export type ListagemAcervoAdmin = z.infer<typeof listagemAcervoAdminSchema>

export const listagemAcervoPublicoSchema = paginationSchema.extend({
  tipo: tipoSchema.optional(),
  album: z.string().max(120).optional(),
  decada: decadaQuery,
})

export type ListagemAcervoPublico = z.infer<typeof listagemAcervoPublicoSchema>
