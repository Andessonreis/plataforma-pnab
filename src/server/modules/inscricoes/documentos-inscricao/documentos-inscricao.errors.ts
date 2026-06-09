import { BadRequestError } from '@server/lib/http/errors'

export class DocumentoIndisponivelError extends BadRequestError {
  constructor(mensagem: string) {
    super(mensagem)
  }
}
