import { NotFoundError } from '@server/lib/http/errors'

export class AtendimentoNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Atendimento não encontrado.')
  }
}
