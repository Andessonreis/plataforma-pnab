import { z } from 'zod'
import type { MemorialTurno } from '@prisma/client'
import { CONFIG_SCHEMAS, visitacaoSchema, type ChaveConfig, type Visitacao } from '@/lib/memorial/config'
import { minutosDoDia } from '@/lib/memorial/agendamento/datas'
import { TURNOS } from '@/lib/memorial/agendamento/regras'

const CHAVES = Object.keys(CONFIG_SCHEMAS) as [ChaveConfig, ...ChaveConfig[]]

export const chaveConfigSchema = z.enum(CHAVES)

const NOME_TURNO: Record<MemorialTurno, string> = { MANHA: 'manhã', TARDE: 'tarde' }

/**
 * Grade de horários coerente: cada horário termina depois de começar, nenhum se sobrepõe
 * a outro (nem entre turnos, porque a vaga é por dia e horário de início) e sobra pelo
 * menos um horário. Turno sem horário é turno fechado, o que é permitido.
 */
export function conferirGrade(horarios: Visitacao['horarios'], ctx: z.RefinementCtx) {
  const todos = TURNOS.flatMap((turno) => horarios[turno].map((h) => ({ ...h, turno })))
  if (todos.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['horarios', 'MANHA'], message: 'Deixe pelo menos um horário aberto para visitas.' })
    return
  }
  for (const h of todos) {
    if (minutosDoDia(h.fim) <= minutosDoDia(h.inicio)) {
      ctx.addIssue({ code: 'custom', path: ['horarios', h.turno], message: `O horário das ${h.inicio} precisa terminar depois de começar.` })
    }
  }
  const ordenados = [...todos].sort((a, b) => minutosDoDia(a.inicio) - minutosDoDia(b.inicio))
  ordenados.slice(1).forEach((h, i) => {
    const anterior = ordenados[i]
    if (minutosDoDia(h.inicio) < minutosDoDia(anterior.fim)) {
      ctx.addIssue({
        code: 'custom',
        path: ['horarios', h.turno],
        message: `O horário das ${h.inicio} (${NOME_TURNO[h.turno]}) se sobrepõe ao das ${anterior.inicio} (${NOME_TURNO[anterior.turno]}).`,
      })
    }
  })
}

/**
 * Valida o valor enviado para uma chave com o schema dela (contrato em lib/memorial/config).
 * A grade só é conferida aqui, no salvamento: a leitura (getConfig) continua tolerante
 * para nunca derrubar a página pública por um valor antigo.
 */
export function validarValorConfig<K extends ChaveConfig>(chave: K, valor: unknown) {
  const schema = chave === 'visitacao' ? visitacaoSchema.superRefine((v, ctx) => conferirGrade(v.horarios, ctx)) : CONFIG_SCHEMAS[chave]
  return schema.parse(valor) as z.infer<(typeof CONFIG_SCHEMAS)[K]>
}
