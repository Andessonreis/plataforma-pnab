import { describe, it, expect } from 'vitest'
import {
  AVISO_SEM_CRONOGRAMA, AVISO_SEM_MARCO_DE_PUBLICACAO, AVISO_SEM_MARCO_DE_RECURSO, marcarCronogramaDoPreliminar,
} from '../cronograma-preliminar'

const PUBLICACAO = { tipo: 'custom', label: 'Publicação dos Projetos Selecionados', dataHora: '2026-09-28T00:00:00' }
const RECURSO = {
  tipo: 'custom', label: 'Período para recursos — seleção', dataHora: '2026-09-29T00:00:00', fimEm: '2026-09-30T23:59:00',
}
const FASE = { tipo: 'fase', fase: 'AVALIACAO', dataHora: '2026-09-22T00:00:00' }

describe('marcarCronogramaDoPreliminar', () => {
  it('liga o marco da publicação e o do período de recursos da seleção pelo rótulo', () => {
    const { cronograma, avisos } = marcarCronogramaDoPreliminar([FASE, PUBLICACAO, RECURSO])

    expect(cronograma).toEqual([
      FASE,
      { ...PUBLICACAO, acao: 'PUBLICACAO_RESULTADO_PRELIMINAR' },
      { ...RECURSO, acao: 'RECURSO_RESULTADO_FINAL_JANELA' },
    ])
    expect(avisos).toEqual([])
  })

  it('preserva o que já estava no marco, como a retificação, e não altera o cronograma recebido', () => {
    const retificado = { ...PUBLICACAO, retificado: { dataHoraAnterior: '2026-09-15T00:00:00', retificacaoNumero: '02' } }
    const original = [retificado, RECURSO]

    const { cronograma } = marcarCronogramaDoPreliminar(original)

    expect((cronograma as Array<Record<string, unknown>>)[0].retificado).toEqual(retificado.retificado)
    expect(original[0]).not.toHaveProperty('acao')
    expect(original[1]).not.toHaveProperty('acao')
  })

  it('respeita a ação que o marco já tem, inclusive a janela do preliminar', () => {
    const jaLigado = [
      { ...PUBLICACAO, acao: 'PUBLICACAO_RESULTADO_PRELIMINAR', diarioOficialUrl: 'https://diario' },
      { ...RECURSO, acao: 'RECURSO_RESULTADO_JANELA' },
    ]

    const { cronograma, avisos } = marcarCronogramaDoPreliminar(jaLigado)

    expect(cronograma).toEqual(jaLigado)
    expect(avisos).toEqual([])
  })

  it('não toma para si um marco parecido que já serve a outra ação', () => {
    const { cronograma, avisos } = marcarCronogramaDoPreliminar([
      { ...PUBLICACAO, acao: 'PUBLICACAO_INSCRITOS' },
      { ...RECURSO, acao: 'RECURSO_HABILITACAO_JANELA' },
    ])

    expect((cronograma as Array<Record<string, unknown>>).map((m) => m.acao)).toEqual(['PUBLICACAO_INSCRITOS', 'RECURSO_HABILITACAO_JANELA'])
    expect(avisos).toEqual([AVISO_SEM_MARCO_DE_PUBLICACAO, AVISO_SEM_MARCO_DE_RECURSO])
  })

  it('avisa do que faltou e liga o que existe', () => {
    const { cronograma, avisos } = marcarCronogramaDoPreliminar([FASE, PUBLICACAO])

    expect((cronograma as Array<Record<string, unknown>>)[1].acao).toBe('PUBLICACAO_RESULTADO_PRELIMINAR')
    expect(avisos).toEqual([AVISO_SEM_MARCO_DE_RECURSO])
  })

  it('cronograma vazio avisa dos dois marcos', () => {
    expect(marcarCronogramaDoPreliminar([]).avisos).toEqual([AVISO_SEM_MARCO_DE_PUBLICACAO, AVISO_SEM_MARCO_DE_RECURSO])
  })

  it('cronograma que não é lista volta como veio, com o aviso', () => {
    expect(marcarCronogramaDoPreliminar(null)).toEqual({ cronograma: null, avisos: [AVISO_SEM_CRONOGRAMA] })
  })

  it('só marcos personalizados são ligados: item de fase com rótulo parecido fica como está', () => {
    const naoPersonalizado = { tipo: 'fase', fase: 'RESULTADO_PRELIMINAR', label: 'Publicação dos Projetos Selecionados', dataHora: '2026-09-28T00:00:00' }

    const { cronograma } = marcarCronogramaDoPreliminar([naoPersonalizado])

    expect(cronograma).toEqual([naoPersonalizado])
  })
})
