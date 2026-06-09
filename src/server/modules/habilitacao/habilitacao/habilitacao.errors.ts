import { ApiError } from '@server/lib/http/errors'

export class ForaDaFaseError extends ApiError {
  constructor(mensagem: string) {
    super('FORA_DA_FASE', mensagem, 422)
  }
}
