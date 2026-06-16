import { BadRequestError, NotFoundError } from '@server/lib/http/errors'

export class TemplateDesconhecidoError extends NotFoundError {
  constructor() {
    super('Template desconhecido.')
  }
}

export class SemEmailCadastradoError extends BadRequestError {
  constructor() {
    super('Sua conta não tem e-mail cadastrado.')
  }
}
