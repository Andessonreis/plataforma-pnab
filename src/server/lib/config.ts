/**
 * Resolve a base URL canônica da aplicação, usada para montar links
 * absolutos (e-mails, tokens de recuperação, etc.).
 *
 * Ordem de precedência: NEXT_PUBLIC_SITE_URL > NEXTAUTH_URL > localhost.
 * A barra final é removida para evitar URLs com `//` ao concatenar paths.
 */
export function getBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return base.replace(/\/$/, '')
}
