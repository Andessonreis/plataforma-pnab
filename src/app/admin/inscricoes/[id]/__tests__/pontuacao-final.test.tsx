import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PontuacaoFinal } from '../pontuacao-final'

describe('PontuacaoFinal', () => {
  it('sem revisão mostra só a nota gravada, com o rótulo do edital com fórmula', () => {
    const html = renderToStaticMarkup(<PontuacaoFinal nota={92.33} hasFormula revisao={null} />)

    expect(html).toContain('Pontuação Final')
    expect(html).toContain('92.33')
    expect(html).toContain('pts')
    expect(html).not.toMatch(/<s[ >]/)
  })

  it('com revisão risca o valor antigo e mostra o novo, para o leitor de tela ouvir os dois', () => {
    const html = renderToStaticMarkup(
      <PontuacaoFinal nota={92.33} hasFormula revisao={{ anterior: 92.33, atual: 95 }} />,
    )

    expect(html).toMatch(/<s[^>]*>.*92\.33.*<\/s>/)
    expect(html).toContain('95.00')
    expect(html).toContain('Valor anterior')
    expect(html).toContain('Valor revisado')
  })

  it('edital sem fórmula usa "Nota Final" com uma casa e sem "pts"', () => {
    const html = renderToStaticMarkup(<PontuacaoFinal nota={8.55} hasFormula={false} revisao={null} />)

    expect(html).toContain('Nota Final')
    expect(html).toContain('8.6')
    expect(html).not.toContain('pts')
  })
})
