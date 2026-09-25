import { vi } from 'vitest'
import { prisma } from '@/lib/db'
import { registrarEmissao, type Emissao } from '@/lib/documentos/emissao'
import { templatePreferido } from '@/lib/documentos/preferencia'
import { generateRelatorioRecursos } from '@/lib/pdf/relatorio-recursos'
import { gerarRelatorioRecursosV1 } from '@/lib/pdf/template-1/relatorio-recursos'

export const JANELA_HABILITACAO = {
  tipo: 'custom',
  label: 'Período para recursos — habilitação',
  dataHora: '2026-09-16T00:00:00',
  fimEm: '2026-09-18T23:59:00',
  acao: 'RECURSO_HABILITACAO_JANELA',
}

export const JANELA_SELECAO = {
  tipo: 'custom',
  label: 'Período para recursos — seleção',
  dataHora: '2026-09-29T00:00:00',
  fimEm: '2026-09-30T23:59:00',
  acao: 'RECURSO_RESULTADO_JANELA',
}

/** Janela do recurso contra o resultado final, a única que o Festival cadastra na seleção. */
export const JANELA_SELECAO_FINAL = {
  tipo: 'custom',
  label: 'Período para recursos — resultado final',
  dataHora: '2026-10-08T00:00:00',
  fimEm: '2026-10-09T23:59:00',
  acao: 'RECURSO_RESULTADO_FINAL_JANELA',
}

export function edital(cronograma: unknown[] = [JANELA_HABILITACAO, JANELA_SELECAO]) {
  return {
    titulo: 'Premiação para Mestres e Mestras de Irecê',
    ano: 2026,
    slug: 'premiacao-mestres',
    cronograma,
  }
}

export const EMISSAO: Emissao = {
  codigo: 'PNAB-ABCD-2345',
  emitidoEm: new Date('2026-09-21T15:00:00Z'),
  urlVerificacao: 'https://portal.exemplo/verificar/PNAB-ABCD-2345',
  hashConteudo: 'hash-do-conteudo',
  template: 2,
}

export const entrada = {
  editalId: 'ed-1',
  etapa: 'habilitacao' as const,
  userId: 'admin-1',
  ip: '10.0.0.1',
}

/** Linha de `Recurso` como o Prisma a devolve na consulta do extrato. */
export function recursoDoBanco(
  numero: string,
  protocoladoEm: string,
  decisao: string | null,
  cpfCnpj: string | null = '12345678901',
) {
  return {
    createdAt: new Date(protocoladoEm),
    decisao,
    inscricao: { numero, proponente: { nome: 'Maria da Silva', cpfCnpj } },
  }
}

/**
 * Relógio em 21/09/2026, com o prazo de habilitação já encerrado, e as
 * dependências devolvendo o caso sem recurso e a preferência de layout na
 * versão 2. Os módulos de emissão, de preferência e dos dois geradores de PDF
 * precisam estar mockados no arquivo de teste que chama isto.
 */
export function prepararCenarioPadrao() {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-21T12:00:00-03:00'))

  vi.mocked(prisma.edital.findUnique).mockResolvedValue(edital() as never)
  vi.mocked(prisma.recurso.findMany).mockResolvedValue([] as never)
  vi.mocked(prisma.inscricao.count).mockResolvedValue(15 as never)
  vi.mocked(registrarEmissao).mockResolvedValue(EMISSAO)
  vi.mocked(templatePreferido).mockResolvedValue(2)
  vi.mocked(generateRelatorioRecursos).mockResolvedValue(Buffer.from('%PDF-fake'))
  vi.mocked(gerarRelatorioRecursosV1).mockResolvedValue(Buffer.from('%PDF-fake-v1'))
}
