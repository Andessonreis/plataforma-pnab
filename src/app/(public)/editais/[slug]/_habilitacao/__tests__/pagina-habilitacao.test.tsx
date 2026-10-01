import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TEMPLATE_RESULTADO_PADRAO } from '@/lib/edital/template-resultado'
import type { HabilitacaoEdital } from '../consulta'

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('../consulta', () => ({ consultarHabilitacao: vi.fn() }))

import { consultarHabilitacao } from '../consulta'
import { PaginaHabilitacao } from '../pagina-habilitacao'

const DADOS_HABILITACAO_MOCK: HabilitacaoEdital = {
  titulo: 'Festival de Arte e Cultura de Irecê',
  ano: 2026,
  slug: 'festival-arte-cultura-irece-centenario-2026',
  disponivel: true,
  dataPublicacaoPrevista: '2026-10-01T00:00:00',
  diarioOficialUrl: 'https://io.irece.ba.gov.br/diario/123.pdf',
  template: TEMPLATE_RESULTADO_PADRAO,
  totalConvocados: 36,
  totalHabilitados: 34,
  totalInabilitados: 2,
  categorias: [
    {
      nome: 'Audiovisual/Cinema',
      ancora: 'audiovisual-cinema',
      vagasInfo: '4 vagas · R$ 10.000,00 por projeto',
      propostas: [
        {
          posicao: 1,
          numero: 'PNAB-2026-0023',
          nome: 'Marcelo Barreto de Lima',
          cpfCnpj: '03014631582',
          modalidade: 'Ampla concorrência',
          notaFinal: 101.50,
          habilitada: true,
        },
        {
          posicao: 2,
          numero: 'PNAB-2026-0024',
          nome: 'Alexander Gondim Barretto',
          cpfCnpj: '05849484507',
          modalidade: 'Ampla concorrência',
          notaFinal: 87.50,
          habilitada: false,
          motivo: 'Pendências de documento físico na Secretaria',
        },
      ],
    },
  ],
}

describe('PaginaHabilitacao', () => {
  it('renderiza título oficial, contagem de habilitados e dados quando disponível', async () => {
    vi.mocked(consultarHabilitacao).mockResolvedValue(DADOS_HABILITACAO_MOCK)

    const html = renderToStaticMarkup(
      await PaginaHabilitacao({ slug: 'festival-arte-cultura-irece-centenario-2026' }),
    )

    expect(html).toContain('Relação de Habilitados Final após entrega de documentação')
    expect(html).toContain('36 propostas analisadas')
    expect(html).toContain('34 habilitadas')
    expect(html).toContain('2 inabilitadas')
    expect(html).toContain('Audiovisual/Cinema')
    expect(html).toContain('PNAB-2026-0023')
    expect(html).toContain('Habilitado')
    expect(html).toContain('PNAB-2026-0024')
    expect(html).toContain('Inabilitado')
    expect(html).toContain('Pendências de documento físico na Secretaria')
    expect(html).toContain('Orientações sobre Recursos')
    expect(html).toContain('02/10/2026')
    expect(html).toContain('05/10/2026')
    expect(html).toContain('Baixar Diário Oficial (PDF)')
  })

  it('exibe "Baixar Relação de Habilitados (PDF)" quando a URL aponta para a relação de habilitados', async () => {
    vi.mocked(consultarHabilitacao).mockResolvedValue({
      ...DADOS_HABILITACAO_MOCK,
      diarioOficialUrl: '/documentos/relacao-de-habilitados_festival-arte-cultura-irece-centenario-2026_2026-10-01.pdf',
    })

    const html = renderToStaticMarkup(
      await PaginaHabilitacao({ slug: 'festival-arte-cultura-irece-centenario-2026' }),
    )

    expect(html).toContain('Baixar Relação de Habilitados (PDF)')
  })

  it('exibe aviso de "Ainda não publicado" quando disponivel é false', async () => {
    vi.mocked(consultarHabilitacao).mockResolvedValue({
      ...DADOS_HABILITACAO_MOCK,
      disponivel: false,
      diarioOficialUrl: null,
    })

    const html = renderToStaticMarkup(
      await PaginaHabilitacao({ slug: 'festival-arte-cultura-irece-centenario-2026' }),
    )

    expect(html).toContain('Ainda não publicado')
    expect(html).toContain('A relação de projetos habilitados deste edital ainda não foi divulgada')
    expect(html).not.toContain('Marcelo Barreto de Lima')
  })
})
