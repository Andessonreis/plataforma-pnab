import { describe, it, expect } from 'vitest'
import { questionarioSchema } from '@/lib/schemas/questionario'
import { MODELOS, modeloPorChave } from '../modelos'

describe('modelos de questionário', () => {
  it.each(MODELOS.map((m) => [m.chave, m]))('o modelo "%s" passa na mesma validação do salvar', (_, modelo) => {
    const r = questionarioSchema.safeParse(modelo.valores)
    expect(r.success ? [] : r.error.issues).toEqual([])
  })

  it('chave desconhecida não pré-preenche nada', () => {
    expect(modeloPorChave('nao-existe')).toBeUndefined()
    expect(modeloPorChave(undefined)).toBeUndefined()
  })
})
