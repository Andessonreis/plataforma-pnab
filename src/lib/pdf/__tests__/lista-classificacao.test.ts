import { describe, it, expect } from 'vitest'
import { generateListaClassificacao } from '../lista-classificacao'
import { AVISO_PREVIA } from '../modelo/lista-classificacao'
import { lerPdf, semEspacos } from '../template-1/__tests__/primitivas.fixtures'
import { categoriaLongaDeTeste, listaClassificacaoDeTeste } from './apoio-pdf'

/**
 * Gera a classificação da versão 2 de verdade e confere o carimbo de prévia,
 * que usa a mesma marca d'água da versão 1.
 */

const AVISO = semEspacos(AVISO_PREVIA)

describe('carimbo de prévia', () => {
  it('leva a marca d\'água em toda folha e o aviso na abertura', async () => {
    const { paginas } = await lerPdf(
      await generateListaClassificacao(listaClassificacaoDeTeste({ situacao: 'PREVIA', categorias: categoriaLongaDeTeste() })),
    )

    expect(paginas.length).toBeGreaterThan(1)
    paginas.forEach((pagina) => expect(pagina).toContain('PRÉVIA'))
    expect(semEspacos(paginas[0])).toContain(AVISO)
  })

  it.each(['CONSOLIDADA', 'FINAL'] as const)('resultado %s sai sem marca d\'água nem aviso', async (situacao) => {
    const { paginas } = await lerPdf(
      await generateListaClassificacao(listaClassificacaoDeTeste({ situacao, categorias: categoriaLongaDeTeste() })),
    )

    paginas.forEach((pagina) => {
      expect(pagina).not.toContain('PRÉVIA')
      expect(semEspacos(pagina)).not.toContain(AVISO)
    })
  })

  it('inscrição fora da classificação sai como "Não se aplica", sem posição', async () => {
    const { paginas } = await lerPdf(await generateListaClassificacao(listaClassificacaoDeTeste()))

    expect(paginas[0]).toContain('Não se aplica')
    expect(paginas[0]).not.toContain('3º')
  })
})
