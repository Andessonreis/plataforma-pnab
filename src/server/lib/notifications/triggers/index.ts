import type { NotificationRuleTrigger } from '@prisma/client'
import type { TriggerDefinition } from '../types'
import { rascunhoPendenteExecutor } from './rascunho-pendente'
import { editalPublicadoExecutor } from './edital-publicado'
import { inscricaoInabilitadaExecutor } from './inscricao-inabilitada'

/**
 * Registry central dos triggers de regras automáticas.
 *
 * Triggers `periodico: true` são avaliados a cada tick do scheduler.
 * Triggers `periodico: false` são disparados sob demanda por hooks no código
 * (ex: ao publicar edital chama-se `dispatchTrigger('EDITAL_PUBLICADO', { editalId })`).
 *
 * Triggers `implementado: false` aparecem na UI marcados como "em breve" e
 * não podem ser ativados pelo admin.
 */
export const TRIGGER_REGISTRY: Record<NotificationRuleTrigger, TriggerDefinition> = {
  INSCRICAO_RASCUNHO_PENDENTE: {
    trigger: 'INSCRICAO_RASCUNHO_PENDENTE',
    label: 'Inscrição em rascunho há mais de X horas',
    descricao:
      'Notifica proponentes cuja inscrição está em rascunho há mais de X horas sem atualização.',
    implementado: true,
    periodico: true,
    executor: rascunhoPendenteExecutor,
  },
  EDITAL_PUBLICADO: {
    trigger: 'EDITAL_PUBLICADO',
    label: 'Edital publicado',
    descricao: 'Notifica audiência configurada quando um edital é publicado.',
    implementado: true,
    periodico: false,
    executor: editalPublicadoExecutor,
  },
  INSCRICAO_INABILITADA: {
    trigger: 'INSCRICAO_INABILITADA',
    label: 'Inscrição inabilitada',
    descricao: 'Notifica o proponente quando sua inscrição é inabilitada na fase de habilitação.',
    implementado: true,
    periodico: false,
    executor: inscricaoInabilitadaExecutor,
  },
  INSCRICAO_ANEXOS_FALTANDO: {
    trigger: 'INSCRICAO_ANEXOS_FALTANDO',
    label: 'Inscrição com anexos faltando',
    descricao: 'Notifica proponentes cuja inscrição enviada tem anexos pendentes.',
    implementado: false,
    periodico: true,
  },
  RESULTADO_PUBLICADO: {
    trigger: 'RESULTADO_PUBLICADO',
    label: 'Resultado publicado',
    descricao: 'Notifica audiência quando resultado preliminar ou final é publicado.',
    implementado: false,
    periodico: false,
  },
  ATENDIMENTO_RESPONDIDO: {
    trigger: 'ATENDIMENTO_RESPONDIDO',
    label: 'Atendimento respondido',
    descricao: 'Notifica autor do atendimento quando há uma nova resposta.',
    implementado: false,
    periodico: false,
  },
  USER_SEM_INSCRICAO: {
    trigger: 'USER_SEM_INSCRICAO',
    label: 'Usuário sem inscrição há X dias',
    descricao: 'Notifica usuários cadastrados que nunca se inscreveram em nenhum edital.',
    implementado: false,
    periodico: true,
  },
}

export function getTriggerDefinition(trigger: NotificationRuleTrigger): TriggerDefinition {
  return TRIGGER_REGISTRY[trigger]
}

export function isTriggerImplementado(trigger: NotificationRuleTrigger): boolean {
  return TRIGGER_REGISTRY[trigger].implementado === true
}
