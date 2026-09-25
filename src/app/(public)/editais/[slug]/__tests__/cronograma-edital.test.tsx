import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { CronogramaDisplayItem } from '@/types/cronograma'
import { CronogramaEdital } from '../cronograma-edital'

const AGORA = new Date('2026-09-25T12:00:00-03:00')

function marco(extra: Partial<CronogramaDisplayItem>): CronogramaDisplayItem {
  return { label: 'Marco', dataHora: '2026-09-22T00:00:00', ...extra }
}

function html(itens: CronogramaDisplayItem[]): string {
  return renderToStaticMarkup(<CronogramaEdital itens={itens} slug="festival" agora={AGORA} />)
}

const PROXIMO = marco({ label: 'Depois', dataHora: '2026-10-05T00:00:00' })

describe('CronogramaEdital — links de resultado', () => {
  it('o marco do resultado preliminar leva à página do preliminar, mesmo com link antigo salvo', () => {
    const saida = html([
      marco({ acao: 'PUBLICACAO_RESULTADO_PRELIMINAR', link: '/editais/festival/resultados' }),
      PROXIMO,
    ])
    expect(saida).toContain('href="/editais/festival/resultados-preliminar"')
    expect(saida).not.toContain('href="/editais/festival/resultados"')
  })

  it('o marco do resultado final leva à página do definitivo', () => {
    const saida = html([marco({ acao: 'PUBLICACAO_RESULTADO_FINAL' }), PROXIMO])
    expect(saida).toContain('href="/editais/festival/resultados-definitivo"')
  })

  it('marco que não é de resultado mantém o link salvo', () => {
    const saida = html([marco({ link: '/editais/festival/algum-lugar' }), PROXIMO])
    expect(saida).toContain('href="/editais/festival/algum-lugar"')
  })

  it('mostra o botão do Diário Oficial quando o marco tem o link', () => {
    const saida = html([
      marco({ acao: 'PUBLICACAO_RESULTADO_FINAL', diarioOficialUrl: 'https://gateway/Ed 2940.pdf' }),
      PROXIMO,
    ])
    expect(saida).toContain('Diário Oficial')
    expect(saida).toContain('https://gateway/Ed 2940.pdf')
  })
})
