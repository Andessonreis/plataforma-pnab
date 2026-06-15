import { BadRequestError, ConflictError } from '@server/lib/http/errors'

export class UsuarioJaCadastradoError extends ConflictError {
  // Mensagem genérica de propósito: não revela qual campo (CPF/CNPJ ou e-mail)
  // já existe, evitando enumeração de cadastros.
  constructor() {
    super('CPF/CNPJ ou e-mail já cadastrado')
  }
}

export class TokenRecuperacaoInvalidoError extends BadRequestError {
  constructor() {
    super('Link inválido ou expirado. Solicite uma nova recuperação de senha')
  }
}
