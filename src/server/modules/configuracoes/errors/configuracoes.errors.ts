import { ConflictError, ForbiddenError, NotFoundError } from '@server/lib/http/errors'

export class CategoriaNaoEncontradaError extends NotFoundError {
  constructor() {
    super('Categoria não encontrada.')
  }
}

export class CategoriaNomeDuplicadoError extends ConflictError {
  constructor() {
    super('Já existe uma categoria com este nome.')
  }
}

export class CategoriaSistemaError extends ForbiddenError {
  constructor() {
    super('Categorias do sistema não podem ser excluídas.')
  }
}

export class TemplateAvaliacaoNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Template não encontrado.')
  }
}

export class TemplateAvaliacaoNomeDuplicadoError extends ConflictError {
  constructor() {
    super('Já existe um template com este nome.')
  }
}

export class TemplateAvaliacaoSistemaError extends ForbiddenError {
  constructor() {
    super('Templates do sistema não podem ser excluídos.')
  }
}

export class TipoAnexoNaoEncontradoError extends NotFoundError {
  constructor() {
    super('Tipo de anexo não encontrado.')
  }
}

export class TipoAnexoSistemaError extends ForbiddenError {
  constructor() {
    super('Tipos do sistema não podem ser excluídos.')
  }
}
