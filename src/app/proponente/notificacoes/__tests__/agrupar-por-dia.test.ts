import { describe, expect, it } from 'vitest'
import { agruparPorDia } from '../agrupar-por-dia'

const AGORA = new Date('2026-10-09T10:00:00-03:00')
const aviso = (id: string, iso: string) => ({ id, createdAt: new Date(iso) })

describe('agruparPorDia', () => {
  it('separa hoje, ontem e dias anteriores, sem reordenar', () => {
    const grupos = agruparPorDia(
      [
        aviso('a', '2026-10-09T08:00:00-03:00'),
        aviso('b', '2026-10-09T01:00:00-03:00'),
        aviso('c', '2026-10-08T22:00:00-03:00'),
        aviso('d', '2026-10-05T09:00:00-03:00'),
      ],
      AGORA,
    )
    expect(grupos.map((g) => g.rotulo)).toEqual(['Hoje', 'Ontem', 'Segunda-feira, 5 de outubro'])
    expect(grupos[0].itens.map((i) => i.id)).toEqual(['a', 'b'])
    expect(grupos[0]).toMatchObject({ data: '9 de outubro', dia: '09', mes: 'out' })
    expect(grupos[2].data).toBe('')
  })

  it('usa o dia de Brasília, não o de UTC', () => {
    // 01:30 UTC do dia 9 ainda é dia 8 em Brasília.
    const [grupo] = agruparPorDia([aviso('x', '2026-10-09T01:30:00Z')], AGORA)
    expect(grupo.rotulo).toBe('Ontem')
  })

  it('mostra o ano em avisos de outro ano', () => {
    const [grupo] = agruparPorDia([aviso('y', '2025-12-30T12:00:00-03:00')], AGORA)
    expect(grupo.rotulo).toBe('Terça-feira, 30 de dezembro de 2025')
  })
})
