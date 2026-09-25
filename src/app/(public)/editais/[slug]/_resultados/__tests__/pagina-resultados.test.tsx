import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TEMPLATE_RESULTADO_PADRAO, type TemplateResultado } from '@/lib/edital/template-resultado'
import type { ResultadoEdital } from '../consulta'

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('../consulta', () => ({ consultarResultado: vi.fn() }))

import { consultarResultado } from '../consulta'
import { PaginaResultados, metadataResultados } from '../pagina-resultados'

const LINHAS = [
  { numero: 'PNAB-2026-0139', posicao: 1, proponente: 'KEL DOURADO', categoria: 'Música', nota: '95.00', situacao: 'CONTEMPLADA' as const },
  { numero: 'PNAB-2026-0154', posicao: 4, proponente: 'SABRINA LIMA', categoria: 'Música', nota: '90.10', situacao: 'SUPLENTE' as const },
  { numero: 'PNAB-2026-0200', posicao: 5, proponente: 'JOAO SOUZA', categoria: 'Música', nota: '60.00', situacao: 'NAO_CONTEMPLADA' as const },
  { numero: 'PNAB-2026-0046', posicao: null, proponente: 'ASSOCIACAO', categoria: 'Música', nota: null, situacao: 'CONTEMPLADA' as const },
]

function resultado(template: TemplateResultado, parcial: Partial<ResultadoEdital> = {}): ResultadoEdital {
  return {
    titulo: 'Festival', ano: 2026, slug: 'festival', fase: 'preliminar', disponivel: true, publicadoEm: null,
    template, porPontuacao: true, diarioOficialUrl: null, definitivoPublicado: false, total: LINHAS.length,
    categorias: [{ ancora: 'categoria-musica', nome: 'Música', quadroDeVagas: null, linhas: LINHAS }],
    ...parcial,
  }
}

async function renderizar(dados: ResultadoEdital, fase: 'preliminar' | 'definitivo' = 'preliminar') {
  vi.mocked(consultarResultado).mockResolvedValue(dados)
  return renderToStaticMarkup(await PaginaResultados({ slug: 'festival', fase }))
}

describe('PaginaResultados — template padrão', () => {
  it('mostra o título da fase, a foto da capa e os rótulos de hoje', async () => {
    const html = await renderizar(resultado(TEMPLATE_RESULTADO_PADRAO))

    expect(html).toContain('Resultado preliminar')
    expect(html).toContain('foto-03.png')
    for (const rotulo of ['Classificado', 'Suplente', 'Desclassificado', 'Não se aplica']) expect(html).toContain(rotulo)
  })

  it('a inscrição sem posição nem nota sai como "Não se aplica", e não como classificada', async () => {
    const html = await renderizar(resultado(TEMPLATE_RESULTADO_PADRAO))
    const linha = html.split('PNAB-2026-0046')[1].slice(0, 400)

    expect(linha).toContain('Não se aplica')
    expect(linha).not.toContain('Classificado')
  })

  it('o definitivo usa o título "Resultado final"', async () => {
    const html = await renderizar(resultado(TEMPLATE_RESULTADO_PADRAO, { fase: 'definitivo' }), 'definitivo')

    expect(html).toContain('Resultado final')
  })
})

describe('PaginaResultados — template do edital', () => {
  const template: TemplateResultado = {
    fotos: ['/images/outra-capa.jpg'],
    titulos: { preliminar: 'Classificação preliminar', definitivo: 'Classificação definitiva' },
    rotulos: {
      classificado: 'Contemplado', desclassificado: 'Não contemplado', suplente: 'Suplente da lista',
      emRecurso: 'Recurso em análise', naoSeAplica: 'Fora do edital',
    },
    foraDaClassificacao: [],
  }

  it('capa, título e rótulos vêm do template', async () => {
    const html = await renderizar(resultado(template))

    expect(html).toContain('Classificação preliminar')
    expect(html).toContain('outra-capa.jpg')
    expect(html).not.toContain('foto-03.png')
    for (const rotulo of ['Contemplado', 'Não contemplado', 'Suplente da lista', 'Fora do edital']) expect(html).toContain(rotulo)
    expect(html).not.toContain('Desclassificado')
  })

  it('o título da aba do navegador acompanha o template', async () => {
    vi.mocked(consultarResultado).mockResolvedValue(resultado(template, { fase: 'definitivo' }))

    expect(await metadataResultados({ slug: 'festival', fase: 'definitivo' })).toMatchObject({
      title: 'Classificação definitiva — Festival',
    })
  })

  it('edital que não existe cai no título genérico', async () => {
    vi.mocked(consultarResultado).mockResolvedValue(null)

    expect(await metadataResultados({ slug: 'nao-existe', fase: 'preliminar' })).toEqual({ title: 'Resultados' })
  })
})
