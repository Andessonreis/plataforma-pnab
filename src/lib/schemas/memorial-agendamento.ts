import { z } from 'zod'
import { ACOES_VISITA, ACOES_COM_MOTIVO, TIPOS_VISITANTE } from '@/lib/memorial/agendamento/status'
import { ehDiaValido, ehMesValido } from '@/lib/memorial/agendamento/datas'
import { paginationSchema } from './pagination'

const dia = z.string().refine(ehDiaValido, 'Data inválida.')
const hora = z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.')
const turno = z.enum(['MANHA', 'TARDE'])
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined))

const statusAgendamento = z.enum([
  'SOLICITADO',
  'EM_ANALISE',
  'CONFIRMADO',
  'RECUSADO',
  'CANCELADO',
  'REALIZADO',
  'NAO_COMPARECEU',
  'REAGENDAMENTO_SOLICITADO',
])

/** No máximo ~2 meses por consulta: é o que um calendário mostra de uma vez. */
const MAX_DIAS_INTERVALO = 62

export const disponibilidadeQuerySchema = z
  .object({ mes: z.string().refine(ehMesValido, 'Mês inválido.').optional(), de: dia.optional(), ate: dia.optional() })
  .refine((q) => q.mes || (q.de && q.ate), 'Informe o mês ou o intervalo de datas.')
  .refine(
    (q) => !q.de || !q.ate || (q.de <= q.ate && Date.parse(q.ate) - Date.parse(q.de) <= MAX_DIAS_INTERVALO * 86_400_000),
    `O intervalo deve ter no máximo ${MAX_DIAS_INTERVALO} dias.`,
  )

export const horarioVisitaSchema = z.object({
  data: dia,
  turno,
  horaInicio: hora,
  horaFim: hora,
})

export const solicitarVisitaSchema = horarioVisitaSchema.extend({
  tipoVisitante: z.enum(TIPOS_VISITANTE, { errorMap: () => ({ message: 'Escolha o tipo de visitante.' }) }),
  instituicao: z.string().trim().min(2, 'Informe a instituição ou o nome do grupo.').max(200),
  quantidade: z.coerce.number().int('Informe um número inteiro.').min(1, 'Informe quantas pessoas vêm.'),
  faixaEtaria: textoOpcional(80),
  turma: textoOpcional(80),
  endereco: textoOpcional(300),
  cidade: textoOpcional(120),
  responsavelNome: z.string().trim().min(3, 'Informe o nome do responsável.').max(160),
  responsavelCargo: textoOpcional(120),
  responsavelEmail: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(200),
  responsavelTelefone: z.string().trim().min(8, 'Informe um telefone para contato.').max(30),
  observacoes: textoOpcional(2000),
  necessidades: textoOpcional(2000),
  preferenciaContato: textoOpcional(40),
  regulamentoVersao: z.coerce.number().int().min(1),
  aceite: z.literal(true, { errorMap: () => ({ message: 'É preciso concordar com o regulamento.' }) }),
  perguntasExtras: z.record(z.unknown()).optional(),
})

export const decidirVisitaSchema = z
  .object({ acao: z.enum(ACOES_VISITA), motivo: textoOpcional(1000) })
  .refine((d) => !ACOES_COM_MOTIVO.includes(d.acao) || !!d.motivo, {
    message: 'Explique o motivo para o visitante.',
    path: ['motivo'],
  })

export const reagendarVisitaSchema = horarioVisitaSchema.extend({ motivo: textoOpcional(1000) })

export const listarVisitasQuerySchema = paginationSchema.extend({
  de: dia.optional(),
  ate: dia.optional(),
  status: statusAgendamento.optional(),
  busca: z.string().trim().max(120).optional(),
})

export const relatorioQuerySchema = z.object({ de: dia, ate: dia }).refine((q) => q.de <= q.ate, 'Período inválido.')

export const regulamentoSchema = z.object({
  texto: z.string().trim().min(20, 'O regulamento precisa ter conteúdo.').max(20_000),
})

export type DisponibilidadeQuery = z.infer<typeof disponibilidadeQuerySchema>
export type SolicitarVisitaInput = z.infer<typeof solicitarVisitaSchema>
export type DecidirVisitaInput = z.infer<typeof decidirVisitaSchema>
export type ReagendarVisitaInput = z.infer<typeof reagendarVisitaSchema>
export type ListarVisitasQuery = z.infer<typeof listarVisitasQuerySchema>
