import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TEMPLATE_RESULTADO_PADRAO } from '@/lib/edital/template-resultado'
import type { SuplentesEdital } from '../consulta'

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('../consulta', () => ({ consultarSuplentes: vi.fn() }))

import { consultarSuplentes } from '../consulta'
import { PaginaSuplentes } from '../pagina-suplentes'

const DADOS_SUPLENTES_MOCK: SuplentesEdital = {
  titulo: 'Festival de Arte e Cultura de Irecê',
  ano: 2026,
  slug: 'festival-arte-cultura-irece-centenario-2026',
  disponivel: true,
  dataPublicacaoPrevista: '2026-10-13T00:00:00',
  diarioOficialUrl: '/api/arquivos/editais/edital-cms3iu7xt000mn16jwjgzm29c/diario-oficial-ed-2949-convocacao-de-suplente.pdf',
  template: TEMPLATE_RESULTADO_PADRAO,
  totalConvocados: 7,
  totalCategorias: 7,
  categorias: [
    {
      nome: 'Cultura Popular',
      ancora: 'cultura-popular',
      vagasInfo: '4 vagas · R$ 5.000,00 por projeto',
      propostas: [
        {
          posicao: 5,
          numero: 'PNAB-2026-0091',
          nome: 'AME Capoeira',
          cpfCnpj: '56025456000160',
          modalidade: 'Ampla concorrência',
          notaFinal: 61.00,
          convocado: false,
          situacao: 'Desclassificado',
          motivo: 'Não apresentação da documentação exigida na habilitação documental',
        },
        {
          posicao: 7,
          numero: 'PNAB-2026-0007',
          nome: 'Paulo Ricardo da Silva Nascimento',
          cpfCnpj: '06092418509',
          modalidade: 'Ampla concorrência',
          notaFinal: 50.50,
          convocado: true,
          situacao: 'Convocado',
          motivo: 'Suplente convocado para vaga remanescente',
        },
      ],
    },
  ],
}

describe('PaginaSuplentes', () => {
  it('renderiza título, contagem de suplentes e propostas quando disponível', async () => {
    vi.mocked(consultarSuplentes).mockResolvedValue(DADOS_SUPLENTES_MOCK)

    const html = renderToStaticMarkup(
      await PaginaSuplentes({ slug: 'festival-arte-cultura-irece-centenario-2026' }),
    )

    expect(html).toContain('Convocação de Suplentes')
    expect(html).toContain('7 propostas suplentes convocadas')
    expect(html).toContain('Cultura Popular')
    expect(html).toContain('PNAB-2026-0091')
    expect(html).toContain('Desclassificado')
    expect(html).toContain('PNAB-2026-0007')
    expect(html).toContain('Convocado')
    expect(html).toContain('15 e 16 de Outubro')
    expect(html).toContain('Baixar Diário Oficial (PDF)')
  })

  it('exibe aviso de "Ainda não publicado" quando disponivel é false', async () => {
    vi.mocked(consultarSuplentes).mockResolvedValue({
      ...DADOS_SUPLENTES_MOCK,
      disponivel: false,
    })

    const html = renderToStaticMarkup(
      await PaginaSuplentes({ slug: 'festival-arte-cultura-irece-centenario-2026' }),
    )

    expect(html).toContain('Ainda não publicado')
    expect(html).not.toContain('Paulo Ricardo')
  })
})
