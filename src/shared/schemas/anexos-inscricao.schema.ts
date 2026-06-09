import { z } from 'zod'

export const anexoUploadMetaSchema = z.object({
  tipo: z.string().min(1, 'tipo é obrigatório'),
  titulo: z.string().min(1, 'titulo é obrigatório'),
})

export type AnexoUploadMeta = z.infer<typeof anexoUploadMetaSchema>
