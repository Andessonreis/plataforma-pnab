import { describe, it, expect, vi } from 'vitest'
import { conclusao, generateRelatorioRecursos } from '../relatorio-recursos'
import { criarDocumentoOficial } from '../documento-oficial'
import { recursosDeTeste as recursos, relatorioRecursosDeTeste as relatorio } from './apoio-pdf'

// Gera o PDF de verdade e só observa com que título o documento foi aberto.
vi.mock('../documento-oficial', async (importOriginal) => {
  const real = await importOriginal<typeof import('../documento-oficial')>()
  return { ...real, criarDocumentoOficial: vi.fn(real.criarDocumentoOficial) }
})

describe('título do documento', () => {
  it.each(['Habilitação', 'Seleção'])('leva a etapa %s no título e mantém o subtítulo', async (etapa) => {
    await generateRelatorioRecursos(relatorio({ etapa }))

    expect(criarDocumentoOficial).toHaveBeenLastCalledWith(
      expect.objectContaining({
        titulo: `Relatório de Recursos Interpostos - ${etapa}`,
        subtitulo: 'Edital de teste · 2026',
      }),
    )
  })
})

describe('conclusao', () => {
  it('sem recurso: afirma que não consta recurso interposto', () => {
    expect(conclusao(relatorio())).toBe(
      'Encerrado o prazo recursal previsto no cronograma do edital para a etapa "Habilitação" — de 16/09/2026 a 18/09/2026, às 23h59 —, ' +
      'não consta recurso interposto nos registros da plataforma.',
    )
  })

  it('com recursos, nenhum fora do prazo: mantém a redação sem ressalva', () => {
    const texto = conclusao(relatorio({ recursos: recursos(2), foraDoPrazo: 0 }))

    expect(texto).toMatch(/foram registrados 2 recurso\(s\), relacionados acima\.$/)
    expect(texto).not.toContain('fora do prazo')
  })

  it('sem informar foraDoPrazo, a redação é a mesma', () => {
    expect(conclusao(relatorio({ recursos: recursos(2) }))).toBe(
      conclusao(relatorio({ recursos: recursos(2), foraDoPrazo: 0 })),
    )
  })

  it('com recursos fora do prazo: diz quantos foram protocolados fora, sem afirmar que foram "no prazo"', () => {
    const texto = conclusao(relatorio({ recursos: recursos(3), foraDoPrazo: 2 }))

    expect(texto).toMatch(
      /^Encerrado o prazo recursal previsto no cronograma do edital para a etapa "Habilitação" — de 16\/09\/2026 a 18\/09\/2026, às 23h59 —, /,
    )
    expect(texto).toMatch(
      /foram registrados 3 recurso\(s\), relacionados acima, dos quais 2 protocolado\(s\) fora desse prazo\.$/,
    )
    expect(texto).not.toMatch(/^No prazo/)
  })
})
