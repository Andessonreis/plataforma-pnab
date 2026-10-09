// Templates do agendamento de visitas do Memorial, registrados à parte e somados ao
// registro central em ../index.ts.

import type { ComponentType } from 'react'
import {
  MemorialNovaSolicitacao,
  memorialNovaSolicitacaoSubject,
  type MemorialNovaSolicitacaoData,
} from './nova-solicitacao'
import {
  MemorialSolicitacaoRecebida,
  memorialSolicitacaoRecebidaSubject,
  type MemorialSolicitacaoRecebidaData,
} from './solicitacao-recebida'
import {
  MemorialVisitaConfirmada,
  memorialVisitaConfirmadaSubject,
  type MemorialVisitaConfirmadaData,
} from './visita-confirmada'
import {
  MemorialVisitaRecusada,
  memorialVisitaRecusadaSubject,
  type MemorialVisitaRecusadaData,
} from './visita-recusada'

export type MemorialEmailTemplate =
  | 'memorial_solicitacao_recebida'
  | 'memorial_visita_confirmada'
  | 'memorial_visita_recusada'
  | 'memorial_nova_solicitacao'

export interface MemorialTemplateDataMap {
  memorial_solicitacao_recebida: MemorialSolicitacaoRecebidaData
  memorial_visita_confirmada: MemorialVisitaConfirmadaData
  memorial_visita_recusada: MemorialVisitaRecusadaData
  memorial_nova_solicitacao: MemorialNovaSolicitacaoData
}

type MemorialRegistry = {
  [K in MemorialEmailTemplate]: {
    Component: ComponentType<MemorialTemplateDataMap[K]>
    defaultSubject: (data: MemorialTemplateDataMap[K]) => string
  }
}

export const memorialTemplateRegistry: MemorialRegistry = {
  memorial_solicitacao_recebida: {
    Component: MemorialSolicitacaoRecebida,
    defaultSubject: memorialSolicitacaoRecebidaSubject,
  },
  memorial_visita_confirmada: {
    Component: MemorialVisitaConfirmada,
    defaultSubject: memorialVisitaConfirmadaSubject,
  },
  memorial_visita_recusada: {
    Component: MemorialVisitaRecusada,
    defaultSubject: memorialVisitaRecusadaSubject,
  },
  memorial_nova_solicitacao: {
    Component: MemorialNovaSolicitacao,
    defaultSubject: memorialNovaSolicitacaoSubject,
  },
}
