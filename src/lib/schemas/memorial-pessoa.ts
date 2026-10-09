import { z } from 'zod'
import { idsSchema, slugSchema, textoOpcional, urlArquivoSchema } from './memorial-comum'

export const pessoaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(200),
  slug: slugSchema,
  biografia: textoOpcional(20000),
  fotoUrl: urlArquivoSchema,
  periodo: textoOpcional(120),
  fontes: textoOpcional(5000),
  itemIds: idsSchema,
  eventoIds: idsSchema,
  exposicaoIds: idsSchema,
})

export type PessoaInput = z.infer<typeof pessoaSchema>
