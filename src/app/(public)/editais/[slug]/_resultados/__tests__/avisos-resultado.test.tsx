import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TEMPLATE_RESULTADO_PADRAO } from '@/lib/edital/template-resultado'
import type { ResultadoEdital } from '../consulta'
import { ComoLer } from '../avisos-resultado'

function dados(fase: 'preliminar' | 'definitivo'): ResultadoEdital {
  return {
    titulo: 'Festival', ano: 2026, slug: 'festival', fase, disponivel: true, publicadoEm: null,
    template: TEMPLATE_RESULTADO_PADRAO, porPontuacao: true, diarioOficialUrl: null,
    definitivoPublicado: fase === 'definitivo', total: 0, categorias: [],
  }
}

describe('ComoLer — caminho para o resultado dos recursos', () => {
  it('o resultado final aponta para a página com a decisão dos recursos', () => {
    const html = renderToStaticMarkup(<ComoLer dados={dados('definitivo')} />)

    expect(html).toContain('href="/editais/festival/resultados-recurso-avaliacao"')
  })

  it('a nota do preliminar não ganha esse link', () => {
    const html = renderToStaticMarkup(<ComoLer dados={dados('preliminar')} />)

    expect(html).not.toContain('resultados-recurso-avaliacao')
  })
})
