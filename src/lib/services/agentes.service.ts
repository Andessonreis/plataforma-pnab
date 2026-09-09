/**
 * Consulta de agentes culturais para a tela e para a exportação.
 *
 * A tela pagina; a exportação leva o recorte inteiro. As duas passam pelo mesmo
 * filtro, então o que a pessoa vê é exatamente o que ela exporta.
 */
import { prisma } from '@/lib/db'
import type { AgenteRow } from '@/lib/agentes/campos'
import { whereDeFiltros, type FiltrosAgentes } from '@/lib/agentes/filtros'

/** Teto de segurança: exportação grande vira job, não requisição web. */
export const LIMITE_EXPORTACAO = 5000

const SELECT = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  cpfCnpj: true,
  tipoProponente: true,
  role: true,
  cidade: true,
  uf: true,
  ativo: true,
  createdAt: true,
  _count: { select: { inscricoes: true } },
} as const

type UserComContagem = Omit<AgenteRow, 'totalInscricoes'> & {
  id: string
  _count: { inscricoes: number }
}

function paraLinha(user: UserComContagem): AgenteRow & { id: string } {
  const { _count, ...resto } = user
  return { ...resto, totalInscricoes: _count.inscricoes }
}

export interface PaginaAgentes {
  agentes: Array<AgenteRow & { id: string }>
  total: number
  totalPages: number
}

export async function listarAgentesPaginado(
  filtros: FiltrosAgentes,
  page: number,
  pageSize: number,
): Promise<PaginaAgentes> {
  const where = whereDeFiltros(filtros)

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: SELECT,
    }),
    prisma.user.count({ where }),
  ])

  return {
    agentes: users.map(paraLinha),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/** Recorte completo, para gerar o arquivo exportado. */
export async function listarAgentesParaExportar(filtros: FiltrosAgentes): Promise<AgenteRow[]> {
  const users = await prisma.user.findMany({
    where: whereDeFiltros(filtros),
    orderBy: { nome: 'asc' },
    take: LIMITE_EXPORTACAO,
    select: SELECT,
  })

  return users.map(paraLinha)
}
