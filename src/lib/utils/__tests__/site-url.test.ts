import { describe, it, expect, afterEach } from 'vitest'
import { siteBaseUrl } from '../site-url'

describe('siteBaseUrl', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  it('usa a variável de ambiente sem a barra final', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://portal.exemplo.gov.br/'

    expect(siteBaseUrl()).toBe('https://portal.exemplo.gov.br')
  })

  it('cai no domínio oficial quando a variável não está carregada', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL

    expect(siteBaseUrl()).toBe('https://culturaeturismo.irece.ba.gov.br')
  })
})
