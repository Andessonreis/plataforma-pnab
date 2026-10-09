import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ prisma: {} }))

import { FINALIDADE_AGENDAMENTO } from '@/lib/memorial/agendamento/perguntas-extras'
import { FINALIDADES, codigoFinalidade, descreverFinalidade } from '../finalidades'

describe('finalidade dos questionários', () => {
  it('usa o mesmo código que o agendamento procura', () => {
    expect(FINALIDADES.map((f) => f.valor)).toContain(FINALIDADE_AGENDAMENTO)
  })

  it('códigos criados à mão viram texto legível', () => {
    expect(descreverFinalidade('inscricao-oficina').rotulo).toBe('Inscricao oficina')
    expect(descreverFinalidade(FINALIDADE_AGENDAMENTO).rotulo).toBe('Perguntas extras do pedido de visita')
  })

  it('transforma o texto livre no código aceito pela API', () => {
    expect(codigoFinalidade('Inscrição na oficina de Fotografia!')).toBe('inscricao-na-oficina-de-fotografia')
    expect(codigoFinalidade('x'.repeat(120))).toHaveLength(80)
  })
})
