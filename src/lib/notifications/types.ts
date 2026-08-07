import type {
  InscricaoStatus,
  TipoProponente,
  NotificationChannel,
  NotificationRuleTrigger,
} from '@prisma/client'

// ── Filtro de audiência ─────────────────────────────────────────────────────
// Combinado em AND: cada campo presente refina o conjunto de userIds.
// Vazio = nenhum usuário (segurança: nunca disparar pra "todos" sem opt-in).

export interface AudienceFilter {
  /** Usuários com inscrição em ao menos um destes editais */
  editais?: string[]
  /** Limita aos editais acima por status da inscrição */
  inscricaoStatus?: InscricaoStatus[]
  /** Tipos de proponente permitidos */
  tipoProponente?: TipoProponente[]
  /** Usuários que nunca se inscreveram em nenhum edital */
  semInscricao?: boolean
  /** Usuários que não têm inscrição neste edital específico (mas podem ter em outros) */
  semInscricaoNoEdital?: string
  /** Lista manual de userIds — adiciona aos resolvidos pelos outros filtros (UNION) */
  userIds?: string[]
  /** Lista manual de emails — resolvidos pra userIds e adicionados (UNION) */
  emails?: string[]
}

// ── Conteúdo de campanha (snapshot) ─────────────────────────────────────────

export interface CampaignContent {
  assunto: string
  corpo: string
  link: string | null
  ctaLabel: string | null
  canais: NotificationChannel[]
}

// ── Configuração de trigger automático ──────────────────────────────────────

export interface RascunhoPendenteConfig {
  /** Idade mínima do rascunho (horas) */
  horas: number
  /** Limita a estes editais (vazio = todos) */
  editalIds?: string[]
}

export interface EditalPublicadoConfig {
  /** Edital específico (preenchido pelo hook quando dispara) */
  editalId?: string
}

export interface InscricaoInabilitadaConfig {
  /** Inscrição específica (preenchida pelo hook) */
  inscricaoId?: string
}

export interface AnexosFaltandoConfig {
  /** Limita a estes editais (vazio = todos) */
  editalIds?: string[]
}

export interface EditalPrazoEncerrandoConfig {
  /** Quantas horas antes do encerramento das inscrições avisar (padrão: 48) */
  horas?: number
  /** Limita a estes editais (vazio = todos) */
  editalIds?: string[]
}

export interface RecursoPrazoEncerrandoConfig {
  /** Quantas horas antes do fim da janela de recurso avisar (padrão: 24) */
  horas?: number
  /** Limita a estes editais (vazio = todos) */
  editalIds?: string[]
}

export type TriggerConfig =
  | RascunhoPendenteConfig
  | EditalPublicadoConfig
  | InscricaoInabilitadaConfig
  | AnexosFaltandoConfig
  | EditalPrazoEncerrandoConfig
  | RecursoPrazoEncerrandoConfig
  | Record<string, never>

// ── Resultado de um trigger ─────────────────────────────────────────────────

export interface TriggerResult {
  /** userIds adicionais que devem receber esta regra agora */
  userIds: string[]
  /** Sobreposições no filtro pra restringir a audiência configurada */
  filtroOverride?: Partial<AudienceFilter>
}

export interface TriggerContext {
  ruleConfig: TriggerConfig
  /** Evento que disparou o trigger (quando sob demanda) */
  event?: Record<string, unknown>
}

export type TriggerExecutor = (ctx: TriggerContext) => Promise<TriggerResult>

// ── Registry público ────────────────────────────────────────────────────────

export interface TriggerDefinition {
  trigger: NotificationRuleTrigger
  label: string
  descricao: string
  implementado: boolean
  /** Disparado periodicamente pelo scheduler */
  periodico: boolean
  executor?: TriggerExecutor
}
