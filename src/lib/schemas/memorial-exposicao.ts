import { z } from 'zod'
import { idsSchema, slugSchema, textoOpcional, urlArquivoSchema } from './memorial-comum'

const dataOpcional = z
  .union([z.literal(''), z.coerce.date()])
  .nullish()
  .transform((v) => (v instanceof Date ? v : null))

export const exposicaoSchema = z
  .object({
    titulo: z.string().trim().min(3, 'Título deve ter no mínimo 3 caracteres').max(200),
    slug: slugSchema,
    subtitulo: textoOpcional(300),
    descricao: textoOpcional(20000),
    periodo: textoOpcional(120),
    localizacao: textoOpcional(200),
    capaUrl: urlArquivoSchema,
    dataInicio: dataOpcional,
    dataFim: dataOpcional,
    destaque: z.boolean().default(false),
    ordem: z.number().int().min(0).max(9999).default(0),
    itemIds: idsSchema,
    pessoaIds: idsSchema,
    eventoIds: idsSchema,
  })
  .refine((d) => !d.dataInicio || !d.dataFim || d.dataFim >= d.dataInicio, {
    message: 'O encerramento não pode ser antes da abertura',
    path: ['dataFim'],
  })

export type ExposicaoInput = z.infer<typeof exposicaoSchema>
