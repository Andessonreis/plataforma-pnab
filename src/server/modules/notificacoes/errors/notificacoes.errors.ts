import { ConflictError, NotFoundError } from '@server/lib/http/errors'

export class CampanhaNaoEncontradaError extends NotFoundError {
  constructor() {
    super('Campanha não encontrada.')
  }
}

export class RegraNaoEncontradaError extends NotFoundError {
  constructor() {
    super('Regra não encontrada.')
  }
}

export class CampanhaNaoEditavelError extends ConflictError {
  constructor() {
    super('Apenas campanhas em RASCUNHO podem ser editadas.')
  }
}

export class CampanhaNaoExcluivelError extends ConflictError {
  constructor() {
    super('Apenas campanhas em RASCUNHO ou FALHA podem ser excluídas.')
  }
}

export class CampanhaNaoDisparavelError extends ConflictError {
  constructor() {
    super('Apenas campanhas em RASCUNHO podem ser disparadas.')
  }
}

export class AudienciaVaziaError extends ConflictError {
  constructor() {
    super('Audiência vazia — nenhum usuário se encaixa no filtro.')
  }
}

export class CampanhaJaFinalizadaError extends ConflictError {
  constructor() {
    super('Campanha já foi enviada ou cancelada.')
  }
}

export class CampanhaComEntregasError extends ConflictError {
  constructor(totalEnviado: number) {
    super(`Já foram entregues ${totalEnviado} notificações — não é mais possível cancelar.`)
  }
}

export class TriggerNaoImplementadoError extends ConflictError {
  constructor(trigger: string) {
    super(`Trigger ${trigger} ainda não implementado.`)
  }
}

export class TriggerNaoImplementadoAtivacaoError extends ConflictError {
  constructor(trigger: string) {
    super(`Trigger ${trigger} ainda não implementado — não é possível ativar.`)
  }
}
