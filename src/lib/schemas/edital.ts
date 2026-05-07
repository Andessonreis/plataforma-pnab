import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Cronograma
// ─────────────────────────────────────────────────────────────────────────────

const cronogramaFaseSchema = z.object({
  tipo: z.literal('fase'),
  fase: z.enum([
    'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
    'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
    'RESULTADO_FINAL', 'ENCERRADO',
  ]),
  dataHora: z.string().default(''),
})

const cronogramaCustomSchema = z.object({
  tipo: z.literal('custom'),
  label: z.string().min(1, 'Descrição do marco é obrigatória'),
  dataHora: z.string().default(''),
  fimEm: z.string().optional(),
  acao: z.enum(['RECURSO_HABILITACAO_JANELA', 'RECURSO_RESULTADO_JANELA']).optional(),
})

const cronogramaLegacySchema = z.object({
  label: z.string().min(1),
  dataHora: z.string().default(''),
})

export const cronogramaItemSchema = z.union([
  cronogramaFaseSchema,
  cronogramaCustomSchema,
  cronogramaLegacySchema,
])

// ─────────────────────────────────────────────────────────────────────────────
// Edital
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Etapas customizadas do wizard de inscrição
// ─────────────────────────────────────────────────────────────────────────────

export const etapaCustomizadaSchema = z.object({
  id: z
    .string()
    .min(1, 'Identificador da etapa é obrigatório')
    .regex(/^[a-z0-9_-]+$/, 'ID só pode conter letras minúsculas, números, hífen ou underline'),
  titulo: z.string().min(1, 'Título da etapa é obrigatório').max(120),
  descricao: z.string().max(2000).optional(),
  ordem: z.number().int().min(0),
  campos: z.array(z.record(z.string(), z.unknown())).default([]),
})

export const editalSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  resumo: z.string().nullable().optional(),
  ano: z.number().int().min(2020).max(2099),
  valorTotal: z.number().nullable().optional(),
  categorias: z.array(z.string()).default([]),
  acoesAfirmativas: z.string().nullable().optional(),
  regrasElegibilidade: z.string().nullable().optional(),
  status: z.enum([
    'RASCUNHO', 'PUBLICADO', 'INSCRICOES_ABERTAS', 'INSCRICOES_ENCERRADAS',
    'HABILITACAO', 'AVALIACAO', 'RESULTADO_PRELIMINAR', 'RECURSO',
    'RESULTADO_FINAL', 'ENCERRADO',
  ]).default('RASCUNHO'),
  cronograma: z.array(cronogramaItemSchema).default([]),
  camposFormulario: z.array(z.record(z.string(), z.unknown())).default([]),
  etapasCustomizadas: z.array(etapaCustomizadaSchema).default([]),
  vagasContemplados: z.number().int().min(1).nullable().optional(),
  vagasSuplentes: z.number().int().min(0).nullable().optional(),
})

export type EditalInput = z.infer<typeof editalSchema>

export const editalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  status: z.string().optional(),
})

export const editalAcessivelSchema = z.object({
  conteudoAcessivel: z.string().min(1, 'Conteúdo acessível é obrigatório'),
})

export type EditalAcessivelInput = z.infer<typeof editalAcessivelSchema>
