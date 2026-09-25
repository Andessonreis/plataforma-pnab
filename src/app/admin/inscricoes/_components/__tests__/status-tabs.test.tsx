import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { StatusTabs } from '../status-tabs'

describe('StatusTabs', () => {
  const html = renderToStaticMarkup(<StatusTabs outrosParams={new URLSearchParams({ editalId: 'ed-1' })} />)

  it('a aba do recurso se chama "Com recurso" e mantém o endereço do filtro', () => {
    expect(html).toContain('Com recurso')
    expect(html).not.toContain('Recurso Aberto')
    expect(html).toContain('status=RECURSO_ABERTO')
  })

  it('as demais abas seguem o nome do status', () => {
    expect(html).toContain('Contemplada')
    expect(html).toContain('Suplente')
  })
})
