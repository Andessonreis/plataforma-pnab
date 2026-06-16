import { z } from 'zod'

export const bannerSchema = z
  .object({
    titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    texto: z.string().min(3, 'Texto deve ter no mínimo 3 caracteres'),
    ctaLabel: z.string().nullable().optional(),
    ctaUrl: z.string().nullable().optional(),
    ativo: z.boolean().default(true),
    inicioEm: z.string().min(1, 'Data de início é obrigatória'),
    fimEm: z.string().min(1, 'Data de fim é obrigatória'),
  })
  .refine((data) => new Date(data.fimEm) > new Date(data.inicioEm), {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['fimEm'],
  })

export type BannerInput = z.infer<typeof bannerSchema>
