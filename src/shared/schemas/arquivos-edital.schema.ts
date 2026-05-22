import { z } from 'zod'

// Tipos de arquivo são livres (cadastráveis via /admin/configuracoes/tipos-anexo) —
// não usamos enum aqui porque um fork pode adicionar novos tipos sem alterar código.
export type TipoArquivoEdital = string

export const arquivoEditalUploadMetaSchema = z.object({
  tipo: z.string().min(1, 'Tipo obrigatório').max(60),
  titulo: z.string().min(1, 'Título obrigatório').max(200),
  acessivel: z.coerce.boolean().optional().default(false),
})

export type ArquivoEditalUploadMeta = z.infer<typeof arquivoEditalUploadMetaSchema>
