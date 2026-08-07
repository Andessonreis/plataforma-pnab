// Registro central dos templates de e-mail.
// Mapeia o nome (string usado pela fila / callers) → componente React + função de assunto.

import type { ComponentType } from 'react'
import {
  AtendimentoRespondido,
  atendimentoRespondidoSubject,
  type AtendimentoRespondidoData,
} from './atendimento-respondido'
import {
  BoasVindas,
  boasVindasSubject,
  type BoasVindasData,
} from './boas-vindas'
import {
  ComprovanteInscricao,
  comprovanteInscricaoSubject,
  type ComprovanteInscricaoData,
} from './comprovante-inscricao'
import {
  EquipeHabilitacaoPendente,
  equipeHabilitacaoPendenteSubject,
  type EquipeHabilitacaoPendenteData,
} from './equipe-habilitacao-pendente'
import {
  Habilitacao,
  habilitacaoSubject,
  type HabilitacaoData,
} from './habilitacao'
import {
  NotificacaoGenerica,
  notificacaoGenericaSubject,
  type NotificacaoGenericaData,
} from './notificacao-generica'
import {
  NotificacaoPrazo,
  notificacaoPrazoSubject,
  type NotificacaoPrazoData,
} from './notificacao-prazo'
import {
  ProtocoloAtendimento,
  protocoloAtendimentoSubject,
  type ProtocoloAtendimentoData,
} from './protocolo-atendimento'
import {
  RecuperacaoSenha,
  recuperacaoSenhaSubject,
  type RecuperacaoSenhaData,
} from './recuperacao-senha'
import {
  RecursoDecidido,
  recursoDecididoSubject,
  type RecursoDecididoData,
} from './recurso-decidido'
import {
  RecursoSubmetido,
  recursoSubmetidoSubject,
  type RecursoSubmetidoData,
} from './recurso-submetido'
import {
  ResultadoFinal,
  resultadoFinalSubject,
  type ResultadoFinalData,
} from './resultado-final'
import {
  ResultadoPreliminar,
  resultadoPreliminarSubject,
  type ResultadoPreliminarData,
} from './resultado-preliminar'

export type EmailTemplate =
  | 'boas_vindas'
  | 'comprovante_inscricao'
  | 'resultado_preliminar'
  | 'resultado_final'
  | 'protocolo_atendimento'
  | 'atendimento_respondido'
  | 'notificacao_prazo'
  | 'recuperacao_senha'
  | 'recurso_submetido'
  | 'recurso_decidido'
  | 'habilitacao'
  | 'equipe_habilitacao_pendente'
  | 'notificacao_generica'

export interface TemplateDataMap {
  boas_vindas: BoasVindasData
  comprovante_inscricao: ComprovanteInscricaoData
  resultado_preliminar: ResultadoPreliminarData
  resultado_final: ResultadoFinalData
  protocolo_atendimento: ProtocoloAtendimentoData
  atendimento_respondido: AtendimentoRespondidoData
  notificacao_prazo: NotificacaoPrazoData
  recuperacao_senha: RecuperacaoSenhaData
  recurso_submetido: RecursoSubmetidoData
  recurso_decidido: RecursoDecididoData
  habilitacao: HabilitacaoData
  equipe_habilitacao_pendente: EquipeHabilitacaoPendenteData
  notificacao_generica: NotificacaoGenericaData
}

interface TemplateEntry<K extends EmailTemplate> {
  Component: ComponentType<TemplateDataMap[K]>
  defaultSubject: (data: TemplateDataMap[K]) => string
}

type Registry = { [K in EmailTemplate]: TemplateEntry<K> }

export const templateRegistry: Registry = {
  boas_vindas: {
    Component: BoasVindas,
    defaultSubject: boasVindasSubject,
  },
  comprovante_inscricao: {
    Component: ComprovanteInscricao,
    defaultSubject: comprovanteInscricaoSubject,
  },
  resultado_preliminar: {
    Component: ResultadoPreliminar,
    defaultSubject: resultadoPreliminarSubject,
  },
  resultado_final: {
    Component: ResultadoFinal,
    defaultSubject: resultadoFinalSubject,
  },
  protocolo_atendimento: {
    Component: ProtocoloAtendimento,
    defaultSubject: protocoloAtendimentoSubject,
  },
  atendimento_respondido: {
    Component: AtendimentoRespondido,
    defaultSubject: atendimentoRespondidoSubject,
  },
  notificacao_prazo: {
    Component: NotificacaoPrazo,
    defaultSubject: notificacaoPrazoSubject,
  },
  recuperacao_senha: {
    Component: RecuperacaoSenha,
    defaultSubject: recuperacaoSenhaSubject,
  },
  recurso_submetido: {
    Component: RecursoSubmetido,
    defaultSubject: recursoSubmetidoSubject,
  },
  recurso_decidido: {
    Component: RecursoDecidido,
    defaultSubject: recursoDecididoSubject,
  },
  habilitacao: {
    Component: Habilitacao,
    defaultSubject: habilitacaoSubject,
  },
  equipe_habilitacao_pendente: {
    Component: EquipeHabilitacaoPendente,
    defaultSubject: equipeHabilitacaoPendenteSubject,
  },
  notificacao_generica: {
    Component: NotificacaoGenerica,
    defaultSubject: notificacaoGenericaSubject,
  },
}
