import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/db'
import { getPublicacao, listAcoesPublicacaoDoCronograma } from '../publicacoes'

// O cronograma "padrão" usado nos cenários, com os 3 tipos de publicação.
const CRONOGRAMA = [
  { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-05-08T00:00' },
  { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-05-22T23:59' },
  { tipo: 'fase', fase: 'HABILITACAO', dataHora: '2026-05-23T00:00' },
  {
    tipo: 'custom',
    label: 'Publicação da lista de inscritos',
    dataHora: '2026-05-25T09:00',
    acao: 'PUBLICACAO_INSCRITOS',
  },
  {
    tipo: 'custom',
    label: 'Publicação dos habilitados',
    dataHora: '2026-05-26T09:00',
    acao: 'PUBLICACAO_HABILITADOS',
  },
  {
    tipo: 'custom',
    label: 'Publicação dos habilitados após recursos',
    dataHora: '2026-06-01T09:00',
    acao: 'PUBLICACAO_HABILITADOS_POS_RECURSOS',
  },
]

const EDITAL_BASE = {
  id: 'ed-1',
  status: 'HABILITACAO' as const,
  cronograma: CRONOGRAMA,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getPublicacao', () => {
  it('retorna null se edital não existe', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValueOnce(null as never)
    const res = await getPublicacao('inexistente', 'PUBLICACAO_INSCRITOS')
    expect(res).toBeNull()
  })

  it('retorna null se edital está em RASCUNHO (sem exposição pública)', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValueOnce({
      ...EDITAL_BASE,
      status: 'RASCUNHO',
    } as never)
    const res = await getPublicacao('rascunho', 'PUBLICACAO_INSCRITOS')
    expect(res).toBeNull()
  })

  it('exists=false quando o cronograma não tem essa ação', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValueOnce({
      ...EDITAL_BASE,
      cronograma: [{ tipo: 'fase', fase: 'HABILITACAO', dataHora: '2026-05-23T00:00' }],
    } as never)
    const res = await getPublicacao('x', 'PUBLICACAO_INSCRITOS')
    expect(res?.exists).toBe(false)
    expect(res?.visivel).toBe(false)
  })

  it('visivel=false quando a data do marco ainda não chegou', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValueOnce(EDITAL_BASE as never)
    const antes = new Date('2026-05-25T11:00:00Z') // 08h BRT, antes de 09h BRT
    const res = await getPublicacao('x', 'PUBLICACAO_INSCRITOS', antes)
    expect(res?.exists).toBe(true)
    expect(res?.visivel).toBe(false)
    expect(res?.items).toEqual([])
    // Não chamou findMany — bloqueio antes da query
    expect(prisma.inscricao.findMany).not.toHaveBeenCalled()
  })

  it('visivel=true quando a data chegou; retorna inscrições filtradas', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValueOnce(EDITAL_BASE as never)
    vi.mocked(prisma.inscricao.findMany).mockResolvedValueOnce([
      {
        numero: '2026-001',
        categoria: 'Música',
        status: 'ENVIADA',
        proponente: { nome: 'João da Silva Santos', cpfCnpj: '12345678901' },
      },
      {
        numero: '2026-002',
        categoria: 'Audiovisual',
        status: 'HABILITADA',
        proponente: { nome: 'Maria Pereira Costa', cpfCnpj: '98765432101' },
      },
    ] as never)

    const depois = new Date('2026-05-25T15:00:00Z') // 12h BRT, depois de 09h BRT
    const res = await getPublicacao('x', 'PUBLICACAO_INSCRITOS', depois)

    expect(res?.exists).toBe(true)
    expect(res?.visivel).toBe(true)
    expect(res?.items).toHaveLength(2)
    expect(res?.items[0]).toMatchObject({
      numero: '2026-001',
      nome: 'João da Silva Santos', // service não mascara — apresentação que mascara
      cpfCnpj: '12345678901',
    })
  })

  it('PUBLICACAO_HABILITADOS filtra por status cumulativo de HABILITADA + INABILITADA', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValueOnce(EDITAL_BASE as never)
    vi.mocked(prisma.inscricao.findMany).mockResolvedValueOnce([] as never)

    const depois = new Date('2026-05-26T15:00:00Z')
    await getPublicacao('x', 'PUBLICACAO_HABILITADOS', depois)

    const call = vi.mocked(prisma.inscricao.findMany).mock.calls[0]?.[0]
    expect(call?.where?.status?.in).toContain('HABILITADA')
    expect(call?.where?.status?.in).toContain('CONTEMPLADA')
    // Inclui INABILITADA — a publicação do resultado da habilitação
    // precisa listar os dois lados (habilitados + inabilitados)
    expect(call?.where?.status?.in).toContain('INABILITADA')
    // Não inclui ENVIADA puro (não passou na habilitação)
    expect(call?.where?.status?.in).not.toContain('ENVIADA')
  })

  it('cronograma como string JSON é parseado', async () => {
    vi.mocked(prisma.edital.findUnique).mockResolvedValueOnce({
      ...EDITAL_BASE,
      cronograma: JSON.stringify(CRONOGRAMA),
    } as never)
    vi.mocked(prisma.inscricao.findMany).mockResolvedValueOnce([] as never)

    const depois = new Date('2026-05-25T15:00:00Z')
    const res = await getPublicacao('x', 'PUBLICACAO_INSCRITOS', depois)
    expect(res?.exists).toBe(true)
    expect(res?.visivel).toBe(true)
  })
})

describe('listAcoesPublicacaoDoCronograma', () => {
  it('retorna as 3 ações na ordem do cronograma', () => {
    const res = listAcoesPublicacaoDoCronograma(CRONOGRAMA)
    expect(res).toEqual([
      { acao: 'PUBLICACAO_INSCRITOS', dataHora: '2026-05-25T09:00' },
      { acao: 'PUBLICACAO_HABILITADOS', dataHora: '2026-05-26T09:00' },
      { acao: 'PUBLICACAO_HABILITADOS_POS_RECURSOS', dataHora: '2026-06-01T09:00' },
    ])
  })

  it('ignora items custom sem acao', () => {
    const res = listAcoesPublicacaoDoCronograma([
      { tipo: 'custom', label: 'X', dataHora: '2026-01-01T00:00' },
    ])
    expect(res).toEqual([])
  })

  it('ignora ações que não são de publicação (janelas)', () => {
    const res = listAcoesPublicacaoDoCronograma([
      {
        tipo: 'custom',
        label: 'Recurso',
        dataHora: '2026-05-27T00:00',
        fimEm: '2026-05-29T23:59',
        acao: 'RECURSO_HABILITACAO_JANELA',
      },
    ])
    expect(res).toEqual([])
  })

  it('input não-array → []', () => {
    expect(listAcoesPublicacaoDoCronograma(null)).toEqual([])
    expect(listAcoesPublicacaoDoCronograma('string-invalida')).toEqual([])
    expect(listAcoesPublicacaoDoCronograma({})).toEqual([])
  })
})
