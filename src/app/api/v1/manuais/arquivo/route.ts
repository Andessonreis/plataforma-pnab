import { badRequest, created } from '@/lib/api/response'
import { rotaManuais } from '@/lib/manuais/rotas'
import * as servico from '@/lib/services/manual.service'

export const runtime = 'nodejs'

/**
 * Recebe o documento (campo `file`) e grava no bucket público `manuais`.
 * Devolve a URL, que o formulário envia depois ao criar ou editar o manual.
 */
export const POST = rotaManuais('POST', '/api/v1/manuais/arquivo', async (req, ctx) => {
  const file = (await req.formData()).get('file')
  if (!(file instanceof File)) return badRequest(ctx, 'Campo "file" é obrigatório.')
  return created(ctx, { url: await servico.enviarArquivo(file) })
})
