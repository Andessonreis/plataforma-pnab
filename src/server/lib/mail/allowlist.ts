// Allowlist de destinatários para ambientes de teste/staging.
//
// Quando a env `EMAIL_TEST_ALLOWLIST` está setada (CSV de e-mails), o
// `sendEmail` só dispara se o destino estiver na lista. Fora da lista, vira
// no-op silencioso com log. Útil pra testar fluxos transacionais sem risco de
// disparar pra usuários reais.
//
// Em produção (e em dev por padrão) a env fica vazia → sem restrição.

export interface AllowlistResult {
  allowed: boolean
  /** `null` quando não há allowlist configurada (modo "envia tudo"). */
  list: string[] | null
}

function parseAllowlist(raw: string | undefined): string[] | null {
  if (!raw) return null
  const list = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.length > 0 ? list : null
}

export function checkAllowlist(to: string): AllowlistResult {
  const list = parseAllowlist(process.env.EMAIL_TEST_ALLOWLIST)
  if (!list) return { allowed: true, list: null }
  return { allowed: list.includes(to.trim().toLowerCase()), list }
}
