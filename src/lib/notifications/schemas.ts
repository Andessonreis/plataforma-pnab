import { z } from 'zod'

// ── Filtro de audiência ─────────────────────────────────────────────────────

export const audienceFilterSchema = z.object({
  editais: z.array(z.string().min(1)).optional(),
  inscricaoStatus: z
    .array(
      z.enum([
        'RASCUNHO',
        'ENVIADA',
        'HABILITADA',
        'INABILITADA',
        'EM_AVALIACAO',
        'RESULTADO_PRELIMINAR',
        'RECURSO_ABERTO',
        'RESULTADO_FINAL',
        'CONTEMPLADA',
        'NAO_CONTEMPLADA',
        'SUPLENTE',
      ]),
    )
    .optional(),
  tipoProponente: z.array(z.enum(['PF', 'MEI', 'PJ', 'COLETIVO'])).optional(),
  semInscricao: z.boolean().optional(),
  semInscricaoNoEdital: z.string().min(1).optional(),
  userIds: z.array(z.string().min(1)).optional(),
  emails: z.array(z.string().email()).optional(),
})

// ── Canais ──────────────────────────────────────────────────────────────────

export const canaisSchema = z
  .array(z.enum(['IN_APP', 'EMAIL']))
  .min(1, 'Selecione ao menos um canal')

// ── Conteúdo (assunto/corpo/CTA) ────────────────────────────────────────────

export const contentSchema = z.object({
  assunto: z.string().min(3, 'Assunto com no mínimo 3 caracteres').max(200),
  corpo: z.string().min(3, 'Corpo com no mínimo 3 caracteres').max(5000),
  link: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
})

// ── Campanha (manual) ───────────────────────────────────────────────────────

export const campaignSchema = contentSchema.extend({
  titulo: z.string().min(3, 'Título com no mínimo 3 caracteres').max(200),
  canais: canaisSchema,
  filtro: audienceFilterSchema,
})

// ── Regra automática ────────────────────────────────────────────────────────

export const ruleSchema = contentSchema.extend({
  nome: z.string().min(3).max(200),
  descricao: z.string().nullable().optional(),
  trigger: z.enum([
    'INSCRICAO_RASCUNHO_PENDENTE',
    'EDITAL_PUBLICADO',
    'INSCRICAO_INABILITADA',
    'INSCRICAO_ANEXOS_FALTANDO',
    'RESULTADO_PUBLICADO',
    'ATENDIMENTO_RESPONDIDO',
    'USER_SEM_INSCRICAO',
    'EDITAL_PRAZO_ENCERRANDO',
    'RECURSO_PRAZO_ENCERRANDO',
  ]),
  config: z.record(z.string(), z.unknown()).default({}),
  canais: canaisSchema,
  filtro: audienceFilterSchema,
})

export type CampaignInput = z.infer<typeof campaignSchema>
export type RuleInput = z.infer<typeof ruleSchema>
export type AudienceFilterInput = z.infer<typeof audienceFilterSchema>
