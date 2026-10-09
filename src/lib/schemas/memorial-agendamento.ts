import { z } from 'zod'
import {
  ACOES_VISITA,
  ACOES_COM_MOTIVO,
  PREFERENCIAS_CONTATO,
  TIPOS_VISITANTE,
  ehVisitaEscolar,
} from '@/lib/memorial/agendamento/status'
import { IDADE_MAXIMA, descreverFaixaEtaria } from '@/lib/memorial/agendamento/faixa-etaria'
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

const idade = z.coerce
  .number({ invalid_type_error: 'Informe a idade em números.' })
  .int('Informe a idade em anos inteiros.')
  .min(0, 'A idade não pode ser negativa.')
  .max(IDADE_MAXIMA, `Informe uma idade de até ${IDADE_MAXIMA} anos.`)

/** Quantidade de pessoas: inteiro de 1 até o teto que a equipe configurou. */
export function quantidadeSchema(maxPessoas: number) {
  return z.coerce
    .number({ invalid_type_error: 'Informe quantas pessoas vêm, em números.' })
    .int('Informe um número inteiro de pessoas.')
    .min(1, 'Informe pelo menos 1 pessoa.')
    .max(maxPessoas, `Cada agendamento atende até ${maxPessoas} pessoas.`)
}

/** Campos do pedido sem as regras que dependem de outro campo ou da configuração. */
export const camposVisitaSchema = horarioVisitaSchema.extend({
  tipoVisitante: z.enum(TIPOS_VISITANTE, { errorMap: () => ({ message: 'Escolha o tipo de visitante.' }) }),
  instituicao: z.string().trim().min(2, 'Informe a instituição ou o nome do grupo.').max(200),
  turma: textoOpcional(80),
  endereco: textoOpcional(300),
  cidade: textoOpcional(120),
  responsavelNome: z.string().trim().min(3, 'Informe o nome do responsável.').max(160),
  responsavelCargo: textoOpcional(120),
  responsavelEmail: z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(200),
  responsavelTelefone: z.string().trim().min(8, 'Informe um telefone para contato.').max(30),
  observacoes: textoOpcional(2000),
  necessidades: textoOpcional(2000),
  preferenciaContato: z
    .enum(PREFERENCIAS_CONTATO, { errorMap: () => ({ message: 'Escolha como prefere ser avisado.' }) })
    .default(PREFERENCIAS_CONTATO[0]),
  regulamentoVersao: z.coerce.number().int().min(1),
  aceite: z.literal(true, { errorMap: () => ({ message: 'É preciso concordar com o regulamento.' }) }),
  perguntasExtras: z.record(z.unknown()).optional(),
})

/**
 * Faixa etária como duas idades. Fica num objeto à parte para a comparação entre elas
 * ser conferida mesmo quando outro campo do pedido ainda está inválido.
 */
export const intervaloIdadesSchema = z
  .object({ idadeMinima: idade, idadeMaxima: idade })
  .refine((d) => d.idadeMinima <= d.idadeMaxima, {
    message: 'A idade inicial precisa ser menor ou igual à final.',
    path: ['idadeMaxima'],
  })

/**
 * Pedido de visita completo. O teto de pessoas vem da configuração do Memorial, por isso
 * o schema é montado com ele; a mesma função valida no navegador e na API. Ano/turma só
 * é aceito para escolas, e a faixa etária é gravada como texto a partir das duas idades.
 */
export function solicitarVisitaSchema(maxPessoas: number) {
  return camposVisitaSchema
    .extend({ quantidade: quantidadeSchema(maxPessoas) })
    .and(intervaloIdadesSchema)
    .transform(({ idadeMinima, idadeMaxima, turma, ...resto }) => ({
      ...resto,
      turma: ehVisitaEscolar(resto.tipoVisitante) ? turma : undefined,
      faixaEtaria: descreverFaixaEtaria(idadeMinima, idadeMaxima),
    }))
}

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
export type SolicitarVisitaInput = z.output<ReturnType<typeof solicitarVisitaSchema>>
export type DecidirVisitaInput = z.infer<typeof decidirVisitaSchema>
export type ReagendarVisitaInput = z.infer<typeof reagendarVisitaSchema>
export type ListarVisitasQuery = z.infer<typeof listarVisitasQuerySchema>
