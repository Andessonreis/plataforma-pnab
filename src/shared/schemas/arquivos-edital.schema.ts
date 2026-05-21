import { z } from 'zod'

export const TIPOS_ARQUIVO_EDITAL = ['PDF', 'ANEXO', 'MODELO', 'PLANILHA', 'DECLARACAO'] as const

export type TipoArquivoEdital = (typeof TIPOS_ARQUIVO_EDITAL)[number]

export const arquivoEditalUploadMetaSchema = z.object({
  tipo: z.enum(TIPOS_ARQUIVO_EDITAL),
  titulo: z.string().min(1, 'Título obrigatório').max(200),
  acessivel: z.coerce.boolean().optional().default(false),
})

export type ArquivoEditalUploadMeta = z.infer<typeof arquivoEditalUploadMetaSchema>
