import { z } from 'zod'
import { normalizarDataAto } from '@/lib/utils/retificacao'

/**
 * Uma retificação só entra no sistema depois de publicada no Diário Oficial:
 * é o ato publicado que a torna válida, não o registro aqui. Por isso número
 * e data de publicação são obrigatórios — sem eles não há o que citar na
 * faixa que o portal mostra ao cidadão.
 */
export const registrarRetificacaoSchema = z.object({
  numero: z
    .string()
    .trim()
    .min(1, 'Informe o número da retificação como saiu no Diário Oficial')
    .max(20),
  publicadoEm: z
    .string()
    .trim()
    .min(1, 'Informe a data de publicação no Diário Oficial')
    .transform(normalizarDataAto),
  resumo: z
    .string()
    .trim()
    .min(10, 'O resumo precisa de ao menos 10 caracteres — é o texto que o cidadão lê')
    .max(1000),
  diarioOficialUrl: z
    .string()
    .trim()
    .url('Link do Diário Oficial inválido')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  alteracoes: z
    .array(
      z.object({
        indice: z.number().int().min(0),
        dataHora: z.string().trim().min(1, 'Informe a nova data do marco'),
        fimEm: z.string().trim().optional().or(z.literal('').transform(() => undefined)),
      }),
    )
    .default([]),
})

export type RegistrarRetificacaoInput = z.infer<typeof registrarRetificacaoSchema>

export const reverterRetificacaoSchema = z.object({
  numero: z.string().trim().min(1, 'Informe o número da retificação a desfazer'),
})
