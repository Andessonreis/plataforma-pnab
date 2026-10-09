import type { MemorialStatusAgendamento, MemorialTurno } from '@prisma/client'

/** Ações da equipe sobre uma visita e de quais status cada uma pode partir. */
export const ACOES_VISITA = ['ANALISAR', 'CONFIRMAR', 'RECUSAR', 'CANCELAR', 'REALIZADA', 'NAO_COMPARECEU'] as const
export type AcaoVisita = (typeof ACOES_VISITA)[number]

const EM_ABERTO: MemorialStatusAgendamento[] = ['SOLICITADO', 'EM_ANALISE', 'REAGENDAMENTO_SOLICITADO']

const TRANSICOES: Record<AcaoVisita, { de: MemorialStatusAgendamento[]; para: MemorialStatusAgendamento }> = {
  ANALISAR: { de: ['SOLICITADO', 'REAGENDAMENTO_SOLICITADO'], para: 'EM_ANALISE' },
  CONFIRMAR: { de: EM_ABERTO, para: 'CONFIRMADO' },
  RECUSAR: { de: EM_ABERTO, para: 'RECUSADO' },
  CANCELAR: { de: [...EM_ABERTO, 'CONFIRMADO'], para: 'CANCELADO' },
  REALIZADA: { de: ['CONFIRMADO'], para: 'REALIZADO' },
  NAO_COMPARECEU: { de: ['CONFIRMADO'], para: 'NAO_COMPARECEU' },
}

/** Recusar ou cancelar sem dizer o porquê deixa o visitante sem resposta. */
export const ACOES_COM_MOTIVO: readonly AcaoVisita[] = ['RECUSAR', 'CANCELAR']

/** Pedidos ainda vivos: a visita não foi encerrada, recusada nem cancelada. */
export const STATUS_ATIVOS: readonly MemorialStatusAgendamento[] = [...EM_ABERTO, 'CONFIRMADO']

/** Só dá para remarcar o que ainda não foi encerrado. */
export const STATUS_REAGENDAVEIS = STATUS_ATIVOS

export function statusAposAcao(atual: MemorialStatusAgendamento, acao: AcaoVisita): MemorialStatusAgendamento | null {
  const regra = TRANSICOES[acao]
  return regra.de.includes(atual) ? regra.para : null
}

export function acoesPossiveis(atual: MemorialStatusAgendamento): AcaoVisita[] {
  return ACOES_VISITA.filter((acao) => statusAposAcao(atual, acao) !== null)
}

export const STATUS_PENDENTES = EM_ABERTO

export const ROTULO_STATUS: Record<MemorialStatusAgendamento, string> = {
  SOLICITADO: 'Solicitada',
  EM_ANALISE: 'Em análise',
  CONFIRMADO: 'Confirmada',
  RECUSADO: 'Recusada',
  CANCELADO: 'Cancelada',
  REALIZADO: 'Realizada',
  NAO_COMPARECEU: 'Não compareceu',
  REAGENDAMENTO_SOLICITADO: 'Reagendamento pedido',
}

export const ROTULO_ACAO: Record<AcaoVisita, string> = {
  ANALISAR: 'Marcar em análise',
  CONFIRMAR: 'Confirmar visita',
  RECUSAR: 'Recusar',
  CANCELAR: 'Cancelar visita',
  REALIZADA: 'Visita realizada',
  NAO_COMPARECEU: 'Grupo não compareceu',
}

export const ROTULO_TURNO: Record<MemorialTurno, string> = { MANHA: 'Manhã', TARDE: 'Tarde' }

/** Categorias do formulário que o Memorial já usava no Google Forms. */
export const TIPOS_VISITANTE = [
  'Unidade Escolar Municipal',
  'Unidade Escolar Estadual',
  'Unidade Escolar Federal',
  'Unidade Escolar Privada',
  'Sociedade Civil Organizada',
  'Órgão Público',
  'Munícipe/Família',
  'Grupo de Turistas',
] as const

/** Ano ou turma só faz sentido para escolas; nos demais tipos o campo nem aparece. */
export function ehVisitaEscolar(tipoVisitante: string): boolean {
  return tipoVisitante.startsWith('Unidade Escolar')
}

/**
 * Canal pelo qual o responsável quer receber a resposta da equipe. O primeiro é o
 * padrão; "Telefone" continua aceito porque pedidos antigos já foram gravados com ele.
 */
export const PREFERENCIAS_CONTATO = ['E-mail', 'WhatsApp', 'E-mail e WhatsApp', 'Telefone'] as const
export type PreferenciaContato = (typeof PREFERENCIAS_CONTATO)[number]

export const ROTULO_PREFERENCIA: Record<PreferenciaContato, string> = {
  'E-mail': 'Por e-mail',
  WhatsApp: 'Por WhatsApp',
  'E-mail e WhatsApp': 'Por e-mail e por WhatsApp',
  Telefone: 'Por ligação telefônica',
}
