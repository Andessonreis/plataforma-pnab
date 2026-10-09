import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CONFIG_PADRAO } from '@/lib/memorial/config'
import { BlocoContato } from '../bloco-contato'
import { FaixaVisite } from '../faixa-visite'

describe('blocos públicos do Memorial', () => {
  it('visitação monta as regras a partir da configuração, sem texto fixo', () => {
    const html = renderToStaticMarkup(
      <FaixaVisite visitacao={{ ...CONFIG_PADRAO.visitacao, maxPessoasPorGrupo: 25 }} contato={CONFIG_PADRAO.contato} />,
    )
    expect(html).toContain('segunda a sexta')
    expect(html).toContain('09:00 às 12:00')
    expect(html).toContain('Grupos de até 25 pessoas')
    expect(html).toContain('href="/memorial/agendar"')
    // Sem link configurado, o botão do Mercado de Arte não aparece
    expect(html).not.toContain('Mercado de Arte')
  })

  it('contato mostra só os canais preenchidos', () => {
    const html = renderToStaticMarkup(
      <BlocoContato contato={{ ...CONFIG_PADRAO.contato, whatsapp: '(74) 99999-0000', instagram: '@memorial' }} />,
    )
    expect(html).toContain('mailto:memorialirececsj@gmail.com')
    expect(html).toContain('https://wa.me/5574999990000')
    expect(html).toContain('https://instagram.com/memorial')
    expect(html).not.toContain('Telefone')
  })
})
