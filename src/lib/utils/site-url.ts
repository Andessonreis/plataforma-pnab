const SITE_URL_FALLBACK = 'https://culturaeturismo.irece.ba.gov.br'

/**
 * URL pública do portal, sem barra final. Cai no domínio oficial quando a
 * variável de ambiente não está carregada (worker, testes).
 */
export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK).replace(/\/$/, '')
}
