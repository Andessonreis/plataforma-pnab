/**
 * Filtros da lista de agentes culturais.
 *
 * O mesmo schema valida a query da tela e a da exportação, e a descrição
 * legível gerada aqui vai pro cabeçalho do PDF e pro log de auditoria — quem
 * abrir o documento ou o log sabe exatamente qual recorte foi tirado.
 */
import { z } from 'zod'
import type { Prisma, UserRole } from '@prisma/client'
import { tipoProponenteLabel, userRoleLabel } from '@/lib/status-maps'
import { CAMPOS_AGENTE, CAMPOS_PADRAO } from './campos'

// ─── Schema ──────────────────────────────────────────────────────────────────

const ROLES = [
  'PROPONENTE',
  'ATENDIMENTO',
  'HABILITADOR',
  'AVALIADOR',
  'ADMIN',
  'SUPER_ADMIN',
  'COMUNICACAO',
] as const

const TIPOS = ['PF', 'MEI', 'PJ', 'COLETIVO'] as const

/** Lista separada por vírgula na query vira array; vazio vira undefined. */
function listaDe<T extends string>(valores: readonly [T, ...T[]]) {
  return z
    .string()
    .optional()
    .transform((valor) => (valor ? valor.split(',').filter(Boolean) : undefined))
    .pipe(z.array(z.enum(valores)).nonempty().optional())
}

export const filtrosAgentesSchema = z.object({
  /** Sem perfil informado a lista é a dos agentes culturais. */
  perfis: listaDe(ROLES).default('PROPONENTE'),
  tipos: listaDe(TIPOS),
  situacao: z.enum(['todos', 'ativos', 'inativos']).default('todos'),
  inscricao: z.enum(['todos', 'com', 'sem']).default('todos'),
  busca: z.string().trim().min(1).max(120).optional(),
  cidade: z.string().trim().min(1).max(80).optional(),
  cadastradoDe: z.string().date().optional(),
  cadastradoAte: z.string().date().optional(),
  campos: z
    .string()
    .optional()
    .transform((valor) => (valor ? valor.split(',').filter(Boolean) : undefined))
    .pipe(z.array(z.enum(CAMPOS_AGENTE)).nonempty().optional()),
})

export type FiltrosAgentes = z.output<typeof filtrosAgentesSchema>

/**
 * Normaliza a query antes de validar: o formulário da tela manda um par por
 * caixa marcada (`perfis=ADMIN&perfis=AVALIADOR`) e a exportação manda lista
 * separada por vírgula. As duas formas chegam aqui como lista.
 */
export function queryParaFiltros(params: URLSearchParams): Record<string, string> {
  const bruto: Record<string, string> = {}

  for (const chave of new Set(params.keys())) {
    const valores = params.getAll(chave).filter((valor) => valor !== '')
    if (valores.length > 0) bruto[chave] = valores.join(',')
  }

  return bruto
}

// ─── Prisma ──────────────────────────────────────────────────────────────────

/** Fim do dia informado, para o intervalo incluir a data limite inteira. */
function fimDoDia(data: string): Date {
  return new Date(`${data}T23:59:59.999-03:00`)
}

function inicioDoDia(data: string): Date {
  return new Date(`${data}T00:00:00.000-03:00`)
}

export function whereDeFiltros(filtros: FiltrosAgentes): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { role: { in: filtros.perfis as UserRole[] } }

  if (filtros.tipos) where.tipoProponente = { in: filtros.tipos }
  if (filtros.situacao !== 'todos') where.ativo = filtros.situacao === 'ativos'
  if (filtros.cidade) where.cidade = { contains: filtros.cidade, mode: 'insensitive' }

  if (filtros.inscricao !== 'todos') {
    where.inscricoes = filtros.inscricao === 'com' ? { some: {} } : { none: {} }
  }

  if (filtros.busca) {
    where.OR = [
      { nome: { contains: filtros.busca, mode: 'insensitive' } },
      { email: { contains: filtros.busca, mode: 'insensitive' } },
      { cpfCnpj: { contains: filtros.busca.replace(/\D/g, '') || filtros.busca } },
    ]
  }

  if (filtros.cadastradoDe || filtros.cadastradoAte) {
    where.createdAt = {
      ...(filtros.cadastradoDe ? { gte: inicioDoDia(filtros.cadastradoDe) } : {}),
      ...(filtros.cadastradoAte ? { lte: fimDoDia(filtros.cadastradoAte) } : {}),
    }
  }

  return where
}

// ─── Descrição legível ───────────────────────────────────────────────────────

const SITUACAO_LABEL: Record<FiltrosAgentes['situacao'], string> = {
  todos: 'Todas',
  ativos: 'Somente ativos',
  inativos: 'Somente inativos',
}

const INSCRICAO_LABEL: Record<FiltrosAgentes['inscricao'], string> = {
  todos: 'Todos',
  com: 'Somente com inscrição',
  sem: 'Somente sem inscrição',
}

function formatData(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/** Pares label/valor prontos pro cabeçalho do PDF e pro log de auditoria. */
export function descreverFiltros(filtros: FiltrosAgentes): Array<{ label: string; value: string }> {
  const descricao = [
    {
      label: 'Perfil de acesso',
      value: filtros.perfis.map((perfil) => userRoleLabel[perfil]).join(', '),
    },
    {
      label: 'Natureza',
      value: filtros.tipos
        ? filtros.tipos.map((tipo) => tipoProponenteLabel[tipo]).join(', ')
        : 'Todas',
    },
    { label: 'Situação do cadastro', value: SITUACAO_LABEL[filtros.situacao] },
  ]

  if (filtros.inscricao !== 'todos') {
    descricao.push({ label: 'Inscrições', value: INSCRICAO_LABEL[filtros.inscricao] })
  }
  if (filtros.cidade) {
    descricao.push({ label: 'Cidade', value: filtros.cidade })
  }
  if (filtros.busca) {
    descricao.push({ label: 'Busca', value: filtros.busca })
  }
  if (filtros.cadastradoDe || filtros.cadastradoAte) {
    const de = filtros.cadastradoDe ? formatData(filtros.cadastradoDe) : 'início'
    const ate = filtros.cadastradoAte ? formatData(filtros.cadastradoAte) : 'hoje'
    descricao.push({ label: 'Cadastrado entre', value: `${de} e ${ate}` })
  }

  return descricao
}

/** Campos escolhidos, ou a seleção padrão quando a exportação não informa. */
export function camposDeFiltros(filtros: FiltrosAgentes) {
  return filtros.campos ?? CAMPOS_PADRAO
}
