import { vi } from 'vitest'
import { prisma } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { PUBLICACAO_STATUS_FILTER } from '@/lib/edital/publicacoes'
import { enqueueEmail } from '@/lib/queue'

export const mockPrisma = vi.mocked(prisma)
export const mockEnqueueEmail = vi.mocked(enqueueEmail)
export const mockLogAudit = vi.mocked(logAudit)

/** O que a divulgação pode liberar: o conjunto da lista pública, sem quem já está em recurso. */
export const STATUS_DIVULGAVEIS = PUBLICACAO_STATUS_FILTER.PUBLICACAO_HABILITADOS.filter(
  (status) => status !== 'RECURSO_ABERTO',
)

/**
 * Cliente entregue ao corpo da transação. Escrita e busca das divulgadas só
 * existem aqui dentro: chamá-las pelo cliente global quebra o teste, o que
 * garante que a divulgação é atômica.
 */
export const tx = { inscricao: { updateMany: vi.fn(), findMany: vi.fn() } }

/** O que a transação e a fila fizeram, e em que ordem. */
export const trilha: { ordem: string[]; revertida: boolean } = { ordem: [], revertida: false }

export const habilitada = {
  numero: 'PNAB-2026-0001',
  status: 'HABILITADA',
  motivoInabilitacao: null,
  proponente: { nome: 'Ana Souza', email: 'ana@exemplo.com' },
}

export const inabilitada = {
  numero: 'PNAB-2026-0002',
  status: 'INABILITADA',
  motivoInabilitacao: 'Documentação obrigatória incompleta',
  proponente: { nome: 'Bia Lima', email: 'bia@exemplo.com' },
}

export const emAvaliacao = {
  numero: 'PNAB-2026-0003',
  status: 'EM_AVALIACAO',
  motivoInabilitacao: null,
  proponente: { nome: 'Caio Melo', email: 'caio@exemplo.com' },
}

// Inabilitada que teve o recurso deferido: a decisão troca o status, mas o
// motivo antigo continua gravado na inscrição.
export const contempladaComMotivoAntigo = {
  numero: 'PNAB-2026-0004',
  status: 'CONTEMPLADA',
  motivoInabilitacao: 'Documento ilegível',
  proponente: { nome: 'Davi Rocha', email: 'davi@exemplo.com' },
}

export const entrada = {
  editalId: 'ed-1',
  enviarEmail: true,
  totalEsperado: 2,
  userId: 'u1',
  ip: '203.0.113.7',
}

/** `where` de cada chamada ao Prisma, sem a tipagem estreita do cliente. */
export interface Filtro {
  editalId?: string
  status?: string | { in: string[] }
  resultadoLiberadoEm?: unknown
}

export function filtrosDe(mock: { mock: { calls: unknown[][] } }): Filtro[] {
  return mock.mock.calls.map(([args]) => (args as { where: Filtro }).where)
}

export function listaDeStatus(filtro: Filtro): string[] {
  return typeof filtro.status === 'object' ? filtro.status.in : []
}

/**
 * Edital existente e duas inscrições decididas (uma habilitada, uma inabilitada)
 * prontas para divulgar. O arquivo de teste que chama isto precisa mockar
 * `@/lib/db` com `edital.findUnique`, `inscricao.count` e `$transaction`.
 */
export function prepararCenarioPadrao() {
  vi.resetAllMocks()
  trilha.ordem = []
  trilha.revertida = false

  mockPrisma.$transaction.mockImplementation((async (corpo: (cliente: typeof tx) => Promise<unknown>) => {
    try {
      const resultado = await corpo(tx)
      trilha.ordem.push('commit')
      return resultado
    } catch (erro) {
      trilha.revertida = true
      throw erro
    }
  }) as never)
  mockPrisma.edital.findUnique.mockResolvedValue({ titulo: 'Premiação Mestres' } as never)
  tx.inscricao.updateMany.mockResolvedValue({ count: 2 })
  tx.inscricao.findMany.mockResolvedValue([habilitada, inabilitada])
  mockEnqueueEmail.mockImplementation(async () => {
    trilha.ordem.push('email')
    return undefined as never
  })
  mockLogAudit.mockResolvedValue(undefined)
}
