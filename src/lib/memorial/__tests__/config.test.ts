import { describe, it, expect, vi, beforeEach } from 'vitest'

const findUnique = vi.fn()
vi.mock('@/lib/db', () => ({ prisma: { memorialConfig: { findUnique: (...a: unknown[]) => findUnique(...a), upsert: vi.fn() } } }))

const { getConfig, CONFIG_PADRAO, CONFIG_SCHEMAS } = await import('../config')

describe('config do Memorial', () => {
  beforeEach(() => findUnique.mockReset())

  it('sem linha salva devolve o padrão', async () => {
    findUnique.mockResolvedValue(null)
    expect(await getConfig('visitacao')).toEqual(CONFIG_PADRAO.visitacao)
  })

  it('valor salvo sobrescreve o padrão e completa campos novos', async () => {
    findUnique.mockResolvedValue({ valor: { maxPessoasPorGrupo: 30 } })
    const v = await getConfig('visitacao')
    expect(v.maxPessoasPorGrupo).toBe(30)
    expect(v.antecedenciaHoras).toBe(48)
  })

  it('valor inválido no banco cai no padrão em vez de quebrar a página', async () => {
    findUnique.mockResolvedValue({ valor: { maxPessoasPorGrupo: -5 } })
    expect(await getConfig('visitacao')).toEqual(CONFIG_PADRAO.visitacao)
  })

  it('os padrões respeitam o próprio schema', () => {
    for (const chave of Object.keys(CONFIG_SCHEMAS) as (keyof typeof CONFIG_SCHEMAS)[]) {
      expect(CONFIG_SCHEMAS[chave].safeParse(CONFIG_PADRAO[chave]).success).toBe(true)
    }
  })
})
