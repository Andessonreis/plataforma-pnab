import { ConflictError } from '@server/lib/http/errors'

export class NewsletterJaInscritoError extends ConflictError {
  constructor() {
    super('Este e-mail já está cadastrado na newsletter.')
  }
}
