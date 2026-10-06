import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    edital: { findUnique: vi.fn() },
    inscricao: { findMany: vi.fn() },
    arquivoEdital: { findFirst: vi.fn() },
  },
}))

import { prisma } from '@/lib/db'
import { consultarHabilitacao } from '../consulta'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.arquivoEdital.findFirst).mockResolvedValue(null as never)
})

describe('consultarHabilitacao — Festival de Arte e Cultura de Irecê', () => {
  const SLUG = 'festival-arte-cultura-irece-centenario-2026'

  it('retorna os 36 convocados, com 35 habilitados e 1 desclassificado', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValue({
      id: 'ed-festival',
      titulo: 'Festival de Arte e Cultura de Irecê — Centenário da Cidade',
      ano: 2026,
      cronograma: [
        {
          acao: 'PUBLICACAO_HABILITADOS',
          tipo: 'custom',
          label: 'Publicação dos Projetos Habilitados',
          dataHora: '2026-10-01T00:00:00',
          diarioOficialUrl: 'https://io.irece.ba.gov.br/diario/123.pdf',
        },
      ],
      resultadoTemplate: null,
    } as never)

    const dados = await consultarHabilitacao(SLUG)

    expect(dados).not.toBeNull()
    expect(dados?.totalConvocados).toBe(36)
    expect(dados?.totalHabilitados).toBe(35)
    expect(dados?.totalInabilitados).toBe(1)
    expect(dados?.disponivel).toBe(true)
    expect(dados?.diarioOficialUrl).toBe('https://io.irece.ba.gov.br/diario/123.pdf')

    // Verifica que Alexander está habilitado após recurso e Araúna desclassificada
    const todasPropostas = dados?.categorias.flatMap((c) => c.propostas) ?? []
    const arauna = todasPropostas.find((p) => p.numero === 'PNAB-2026-0110')
    const alexander = todasPropostas.find((p) => p.numero === 'PNAB-2026-0024')

    expect(arauna?.habilitada).toBe(false)
    expect(arauna?.situacao).toBe('Desclassificado')
    expect(arauna?.motivo).toContain('Desclassificado pela não apresentação de recurso')

    expect(alexander?.habilitada).toBe(true)
    expect(alexander?.motivo).toBe('Habilitado após recurso')
  })

  it('marca disponivel como false quando o Diário Oficial ainda não foi informado e não está em preview', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValue({
      id: 'ed-festival',
      titulo: 'Festival de Arte e Cultura de Irecê — Centenário da Cidade',
      ano: 2026,
      cronograma: [
        {
          acao: 'PUBLICACAO_HABILITADOS',
          tipo: 'custom',
          label: 'Publicação dos Projetos Habilitados',
          dataHora: '2026-10-01T00:00:00',
        },
      ],
      resultadoTemplate: null,
    } as never)

    const dados = await consultarHabilitacao(SLUG)

    expect(dados?.disponivel).toBe(false)
  })

  it('marca disponivel como true quando preview é solicitado mesmo sem Diário Oficial', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValue({
      id: 'ed-festival',
      titulo: 'Festival de Arte e Cultura de Irecê — Centenário da Cidade',
      ano: 2026,
      cronograma: [
        {
          acao: 'PUBLICACAO_HABILITADOS',
          tipo: 'custom',
          label: 'Publicação dos Projetos Habilitados',
          dataHora: '2026-10-01T00:00:00',
        },
      ],
      resultadoTemplate: null,
    } as never)

    const dados = await consultarHabilitacao(SLUG, { preview: true })

    expect(dados?.disponivel).toBe(true)
  })
})
