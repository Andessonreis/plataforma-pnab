import { BadRequestError, ConflictError } from '@server/lib/http/errors'

export class UsuarioJaCadastradoError extends ConflictError {
  constructor(campo: 'CPF/CNPJ' | 'E-mail') {
    super(`${campo} já cadastrado`)
  }
}

export class TokenRecuperacaoInvalidoError extends BadRequestError {
  constructor() {
    super('Link inválido ou expirado. Solicite uma nova recuperação de senha')
  }
}
