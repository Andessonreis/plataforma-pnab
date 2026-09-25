import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TEMPLATE_RESULTADO_PADRAO } from '@/lib/edital/template-resultado'
import type { ResultadoRecursos } from '../consulta-recursos'

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('../consulta-recursos', () => ({ consultarResultadoRecursos: vi.fn() }))

import { consultarResultadoRecursos } from '../consulta-recursos'
import { PaginaRecursos, metadataRecursos } from '../pagina-recursos'

const RECURSOS = [
  { posicao: 1, numero: 'PNAB-2026-0139', proponente: 'Cleriston Kerley Dourado', cpfCnpj: '003.***.***-85', decisao: 'DEFERIDO', situacao: 'Deferido' },
  { posicao: 2, numero: 'PNAB-2026-0109', proponente: 'ESCOLA DE MUSICA IRECE LTDA', cpfCnpj: '557.***.***-00', decisao: 'INDEFERIDO', situacao: 'Indeferido' },
]

function dados(parcial: Partial<ResultadoRecursos> = {}): ResultadoRecursos {
  return {
    titulo: 'Festival', ano: 2026, slug: 'festival', fotos: TEMPLATE_RESULTADO_PADRAO.fotos, disponivel: true, etapa: 'Seleção', rotuloDoUniverso: 'Inscrições classificadas',
    prazo: { inicio: new Date('2026-09-23T03:00:00Z'), fim: new Date('2026-09-25T02:59:00Z') }, totalInscricoes: 111,
    recursos: RECURSOS, relatorioUrl: 'https://storage/relatorio.pdf',
    diarioOficialUrl: 'https://gateway/Diario%20Oficial%20-%20Ed%202938.pdf', ...parcial,
  }
}

async function renderizar(d: ResultadoRecursos | null) {
  vi.mocked(consultarResultadoRecursos).mockResolvedValue(d)
  return renderToStaticMarkup(await PaginaRecursos({ slug: 'festival' }))
}

describe('PaginaRecursos', () => {
  it('lista cada recurso com a decisão, o CPF mascarado e o resumo da etapa', async () => {
    const html = await renderizar(dados())

    expect(html).toContain('Resultado dos recursos')
    for (const termo of ['PNAB-2026-0139', 'Cleriston Kerley Dourado', 'Deferido', 'Indeferido', '003.***.***-85', 'ESCOLA DE MUSICA IRECE LTDA']) {
      expect(html).toContain(termo)
    }
    expect(html).toContain('Prazo para interposição')
    expect(html).toContain('Inscrições classificadas')
    expect(html).toContain('2 recursos interpostos')
  })

  it('oferece o relatório em PDF, o Diário Oficial e o caminho para o resultado final', async () => {
    const html = await renderizar(dados())

    expect(html).toContain('Baixar relatório (PDF)')
    expect(html).toContain('href="https://storage/relatorio.pdf"')
    expect(html).toContain('Diário Oficial (Edição nº 2.938)')
    expect(html).toContain('href="/editais/festival/resultados-definitivo"')
  })

  it('sem relatório cadastrado não mostra o botão de PDF', async () => {
    expect(await renderizar(dados({ relatorioUrl: null }))).not.toContain('Baixar relatório')
  })

  it('antes do resultado final avisa que não foi publicado e não lista ninguém', async () => {
    const html = await renderizar(dados({ disponivel: false, recursos: [], relatorioUrl: null, diarioOficialUrl: null }))

    expect(html).toContain('Ainda não publicado')
    expect(html).not.toContain('Cleriston')
    expect(html).not.toContain('Deferido')
  })

  it('etapa sem recurso diz isso, sem tabela', async () => {
    const html = await renderizar(dados({ recursos: [] }))

    expect(html).toContain('Nenhum recurso foi interposto')
    expect(html).not.toContain('<table')
  })

  it('edital que não existe vira 404', async () => {
    await expect(renderizar(null)).rejects.toThrow('NOT_FOUND')
  })

  it('o título da aba acompanha o edital', async () => {
    vi.mocked(consultarResultadoRecursos).mockResolvedValue(dados())
    expect(await metadataRecursos('festival')).toEqual({ title: 'Resultado dos recursos — Festival' })

    vi.mocked(consultarResultadoRecursos).mockResolvedValue(null)
    expect(await metadataRecursos('x')).toEqual({ title: 'Resultados' })
  })
})
