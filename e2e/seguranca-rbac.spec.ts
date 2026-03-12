import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

/* ──────────────────────────────────────────────────────────────────────────────
 * TESTE E2E — Seguranca e RBAC (Role-Based Access Control)
 *
 * Verifica que o middleware de protecao de rotas redireciona corretamente:
 *  1. Proponente nao acessa /admin
 *  2. Admin nao acessa /proponente
 *  3. Avaliador nao acessa /admin (redireciona para /avaliador)
 *  4. Visitante nao acessa /proponente (redireciona para /login)
 *  5. Visitante nao acessa /admin (redireciona para /login)
 *  6. Proponente nao chama API admin (recebe 403)
 *
 * Rodar: npx playwright test e2e/seguranca-rbac.spec.ts
 * ────────────────────────────────────────────────────────────────────────────── */

// ── Helper: login sem esperar rota especifica ────────────────────────────────

async function loginRaw(
  page: import('@playwright/test').Page,
  cpf: string,
  senha: string,
) {
  await page.goto('/login')
  await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })
  await page.locator('#cpf-ou-cnpj').fill(cpf)
  await page.locator('#senha').fill(senha)
  await page.locator('button[type="submit"]').click()
  // Espera qualquer redirect pos-login (admin, proponente, avaliador ou /)
  await page.waitForURL(/\/(admin|proponente|avaliador|$)/, { timeout: 30000 })
  await page.waitForLoadState('load')
}

// ── Testes de RBAC via middleware ─────────────────────────────────────────────

test.describe('Seguranca RBAC — Protecao de Rotas', () => {
  test.setTimeout(60_000)

  // ── 1. Proponente tenta acessar /admin → redirect para / ──────────────────

  test('1. Proponente nao acessa /admin — redirect para /', async ({ page }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    expect(page.url()).toContain('/proponente')

    // Tenta acessar area admin
    await page.goto('/admin')
    await page.waitForLoadState('load')

    // Middleware redireciona proponente para /
    const url = page.url()
    expect(url).not.toContain('/admin')
    // Deve estar em / (homepage) — role PROPONENTE nao esta em ROLES_ADMIN
    expect(url.endsWith('/') || url.includes('/login')).toBeTruthy()
  })

  // ── 2. Admin tenta acessar /proponente → redirect para / ──────────────────

  test('2. Admin nao acessa /proponente — redirect para /', async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    expect(page.url()).toContain('/admin')

    // Tenta acessar area do proponente
    await page.goto('/proponente')
    await page.waitForLoadState('load')

    // Middleware redireciona admin para / (role !== PROPONENTE)
    const url = page.url()
    expect(url).not.toContain('/proponente')
  })

  // ── 3. Avaliador tenta acessar /admin → redirect para /avaliador ──────────

  test('3. Avaliador nao acessa /admin — redirect para /avaliador', async ({
    page,
  }) => {
    await loginRaw(
      page,
      CREDENTIALS.AVALIADOR.cpf,
      CREDENTIALS.AVALIADOR.senha,
    )

    // Tenta acessar area admin
    await page.goto('/admin')
    await page.waitForLoadState('load')

    // Middleware redireciona AVALIADOR para /avaliador (tratamento especial)
    const url = page.url()
    expect(url).not.toMatch(/\/admin(\/|$)/)
    expect(url).toContain('/avaliador')
  })

  // ── 4. Visitante tenta acessar /proponente → redirect /login ──────────────

  test('4. Visitante nao acessa /proponente — redirect para /login', async ({
    page,
  }) => {
    // Sem fazer login, acessa area protegida
    await page.goto('/proponente')
    await page.waitForLoadState('load')

    const url = page.url()
    expect(url).toContain('/login')
    expect(url).not.toContain('/proponente')
  })

  // ── 5. Visitante tenta acessar /admin → redirect /login ───────────────────

  test('5. Visitante nao acessa /admin — redirect para /login', async ({
    page,
  }) => {
    // Sem fazer login, acessa backoffice
    await page.goto('/admin')
    await page.waitForLoadState('load')

    const url = page.url()
    expect(url).toContain('/login')
    expect(url).not.toContain('/admin')
  })

  // ── 6. Proponente chama API admin → 403 ───────────────────────────────────

  test('6. Proponente chama API de admin diretamente — recebe 403', async ({
    page,
  }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    expect(page.url()).toContain('/proponente')

    // Tenta criar edital via API (operacao exclusiva de ADMIN)
    const res = await page.request.post('/api/admin/editais', {
      data: {
        titulo: 'Edital Intruso',
        resumo: 'Tentativa de criacao indevida',
        ano: 2026,
        valorTotal: 10000,
        categorias: ['Musica'],
        status: 'RASCUNHO',
      },
    })

    expect(res.status()).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('FORBIDDEN')
  })
})

// ── Testes de subrotas protegidas ────────────────────────────────────────────

test.describe('Seguranca RBAC — Subrotas Protegidas', () => {
  test.setTimeout(60_000)

  test('Visitante nao acessa /proponente/inscricoes — redirect /login', async ({
    page,
  }) => {
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('load')

    const url = page.url()
    expect(url).toContain('/login')
  })

  test('Visitante nao acessa /admin/editais — redirect /login', async ({
    page,
  }) => {
    await page.goto('/admin/editais')
    await page.waitForLoadState('load')

    const url = page.url()
    expect(url).toContain('/login')
  })

  test('Proponente nao acessa /admin/editais — redirect para /', async ({
    page,
  }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)

    await page.goto('/admin/editais')
    await page.waitForLoadState('load')

    const url = page.url()
    expect(url).not.toContain('/admin')
  })

  test('Proponente nao acessa /admin/inscricoes — redirect para /', async ({
    page,
  }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)

    await page.goto('/admin/inscricoes')
    await page.waitForLoadState('load')

    const url = page.url()
    expect(url).not.toContain('/admin')
  })

  test('Avaliador nao acessa /admin/editais — redirect para /avaliador', async ({
    page,
  }) => {
    await loginRaw(
      page,
      CREDENTIALS.AVALIADOR.cpf,
      CREDENTIALS.AVALIADOR.senha,
    )

    await page.goto('/admin/editais')
    await page.waitForLoadState('load')

    const url = page.url()
    expect(url).toContain('/avaliador')
    expect(url).not.toContain('/admin')
  })
})
