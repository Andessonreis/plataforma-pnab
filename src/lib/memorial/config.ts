import { z } from 'zod'
import { prisma } from '@/lib/db'

/**
 * Configurações do Memorial editáveis pelo painel (tabela MemorialConfig, uma linha por chave).
 * Nenhum texto institucional, contato ou regra de visita fica fixo no código: os valores
 * abaixo são só o ponto de partida enquanto a equipe não salvar a própria versão.
 */

const horarioSchema = z.object({
  inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fim: z.string().regex(/^\d{2}:\d{2}$/),
})

export const institucionalSchema = z.object({
  titulo: z.string().min(1).max(120),
  chamada: z.string().max(240),
  texto: z.string().max(5000),
})

export const contatoSchema = z.object({
  email: z.string().email().or(z.literal('')),
  telefone: z.string().max(40),
  whatsapp: z.string().max(40),
  instagram: z.string().max(200),
  site: z.string().max(200),
  endereco: z.string().max(300),
  funcionamento: z.string().max(300),
})

export const visitacaoSchema = z.object({
  antecedenciaHoras: z.number().int().min(0).max(720),
  maxPessoasPorGrupo: z.number().int().min(1).max(500),
  maxGruposPorDia: z.number().int().min(1).max(20),
  umTurnoPorDia: z.boolean(),
  diasSemana: z.array(z.number().int().min(0).max(6)).min(1),
  horarios: z.object({
    MANHA: z.array(horarioSchema),
    TARDE: z.array(horarioSchema),
  }),
  mercadoArteUrl: z.string().max(500),
  textoRegistroFotografico: z.string().max(1500),
  textoSolicitacaoRecebida: z.string().max(1500),
})

export const CONFIG_SCHEMAS = {
  institucional: institucionalSchema,
  contato: contatoSchema,
  visitacao: visitacaoSchema,
} as const

export type ChaveConfig = keyof typeof CONFIG_SCHEMAS
export type Institucional = z.infer<typeof institucionalSchema>
export type Contato = z.infer<typeof contatoSchema>
export type Visitacao = z.infer<typeof visitacaoSchema>
export type ValorConfig<K extends ChaveConfig> = z.infer<(typeof CONFIG_SCHEMAS)[K]>

export function isChaveConfig(chave: string): chave is ChaveConfig {
  return Object.prototype.hasOwnProperty.call(CONFIG_SCHEMAS, chave)
}

export const CONFIG_PADRAO: { [K in ChaveConfig]: ValorConfig<K> } = {
  institucional: {
    titulo: 'Memorial de Irecê',
    chamada: 'Uma história contada, vivida e preservada.',
    texto:
      'O Memorial de Irecê é história contada, vivida, é memória traduzida em marcas e marcos, são lembranças do hoje, do ontem vislumbrando o futuro.',
  },
  contato: {
    email: 'memorialirececsj@gmail.com',
    telefone: '',
    whatsapp: '',
    instagram: '',
    site: '',
    endereco: '',
    funcionamento: '',
  },
  visitacao: {
    antecedenciaHoras: 48,
    maxPessoasPorGrupo: 20,
    maxGruposPorDia: 2,
    umTurnoPorDia: true,
    diasSemana: [1, 2, 3, 4, 5],
    horarios: {
      MANHA: [
        { inicio: '09:00', fim: '09:45' },
        { inicio: '09:45', fim: '10:30' },
        { inicio: '10:30', fim: '11:15' },
        { inicio: '11:15', fim: '12:00' },
      ],
      TARDE: [
        { inicio: '14:00', fim: '14:45' },
        { inicio: '14:45', fim: '15:30' },
        { inicio: '15:30', fim: '16:15' },
        { inicio: '16:15', fim: '17:00' },
      ],
    },
    mercadoArteUrl: '',
    textoRegistroFotografico:
      'Durante a visita poderão ser feitos registros fotográficos para fins de divulgação institucional.',
    textoSolicitacaoRecebida:
      'Solicitação recebida. Sua visita ainda NÃO está confirmada. A equipe do Memorial analisará a disponibilidade e enviará a confirmação por e-mail e/ou WhatsApp.',
  },
}

/**
 * Lê uma configuração. Valor ausente ou que não passa mais no schema (ex.: campo novo
 * adicionado depois) é completado com o padrão, para a página pública nunca quebrar.
 */
export async function getConfig<K extends ChaveConfig>(chave: K): Promise<ValorConfig<K>> {
  const padrao = CONFIG_PADRAO[chave] as ValorConfig<K>
  const linha = await prisma.memorialConfig.findUnique({ where: { chave } })
  if (!linha || typeof linha.valor !== 'object' || linha.valor === null) return padrao
  const mesclado = { ...padrao, ...(linha.valor as object) }
  const lido = CONFIG_SCHEMAS[chave].safeParse(mesclado)
  return (lido.success ? lido.data : padrao) as ValorConfig<K>
}

/** Salva (substitui) uma configuração já validada pelo chamador com o schema da chave. */
export async function salvarConfig<K extends ChaveConfig>(
  chave: K,
  valor: ValorConfig<K>,
  userId: string,
): Promise<void> {
  await prisma.memorialConfig.upsert({
    where: { chave },
    create: { chave, valor, atualizadoPor: userId },
    update: { valor, atualizadoPor: userId },
  })
}
