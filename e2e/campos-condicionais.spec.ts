import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

/**
 * TESTE E2E — Campos condicionais por tipo de proponente
 *
 * 1. ADMIN cria edital via API com campo geral + campo PJ/MEI-only
 * 2. Proponente PF faz inscrição → campo PJ não aparece
 * 3. Proponente PJ faz inscrição → campo PJ aparece
 * 4. ADMIN edita edital → chips condicionais persistidos
 */

const PROPONENTE_PF = { cpf: '12345678901', senha: 'Teste@123' }   // Carlos Silva — PF
const PROPONENTE_PJ = { cpf: '44555666000188', senha: 'Teste@123' } // Irecê Produções — PJ

const EDITAL_TITULO = `Edital Campos Condicionais ${Date.now()}`
const CAMPO_GERAL = 'Resumo do Projeto'
const CAMPO_PJ_ONLY = 'Razão Social da Empresa'

let editalId = ''

test.describe.serial('Campos condicionais por tipo de proponente', () => {
  test.setTimeout(60_000)

  // ── 1. Criar edital via API (autenticado como admin) ──────────────
  test('1. Criar edital com campos condicionais via API', async ({ page }) => {
    // Login como admin para obter sessão/cookies
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    // Criar edital via fetch dentro do contexto autenticado do browser
    const result = await page.evaluate(async (data) => {
      const res = await fetch('/api/admin/editais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return { status: res.status, body: await res.json() }
    }, {
      titulo: EDITAL_TITULO,
      resumo: 'Edital para testar campos condicionais por tipo de proponente.',
      ano: 2026,
      status: 'INSCRICOES_ABERTAS',
      categorias: [],
      camposFormulario: [
        {
          nome: 'resumo_do_projeto',
          label: CAMPO_GERAL,
          tipo: 'textarea',
          obrigatorio: true,
          placeholder: '',
          opcoes: [],
          hint: '',
          tiposProponente: [],  // todos veem
        },
        {
          nome: 'razao_social_da_empresa',
          label: CAMPO_PJ_ONLY,
          tipo: 'texto',
          obrigatorio: true,
          placeholder: '',
          opcoes: [],
          hint: '',
          tiposProponente: ['PJ', 'MEI'],  // só PJ e MEI
        },
      ],
    })

    console.log('  API status:', result.status, JSON.stringify(result.body).slice(0, 200))
    expect(result.status).toBe(201)
    editalId = result.body.data?.id ?? result.body.id ?? ''
    expect(editalId).toBeTruthy()
    console.log(`  Edital criado: ${editalId}`)
  })

  // ── 2. Proponente PF não vê campo PJ-only ────────────────────────
  test('2. Proponente PF não vê campo exclusivo PJ/MEI', async ({ page }) => {
    test.skip(!editalId, 'Edital não foi criado no teste anterior')

    await login(page, PROPONENTE_PF.cpf, PROPONENTE_PF.senha)
    await page.goto(`/proponente/inscricoes/nova?editalId=${editalId}`)
    await page.waitForLoadState('networkidle')

    if (page.url().includes('/editar')) {
      console.log('  PF já tem inscrição, verificando na edição')
    }

    await navigateToStepDados(page)

    // Campo geral DEVE estar visível
    await expect(page.getByText(CAMPO_GERAL)).toBeVisible({ timeout: 5000 })

    // Campo PJ-only NÃO deve existir no DOM para PF
    await expect(page.getByText(CAMPO_PJ_ONLY)).toHaveCount(0)

    console.log('  PF: campo geral visível, campo PJ oculto')
  })

  // ── 3. Proponente PJ vê ambos os campos ──────────────────────────
  test('3. Proponente PJ vê campo exclusivo PJ/MEI', async ({ page }) => {
    test.skip(!editalId, 'Edital não foi criado no teste anterior')

    await login(page, PROPONENTE_PJ.cpf, PROPONENTE_PJ.senha)
    await page.goto(`/proponente/inscricoes/nova?editalId=${editalId}`)
    await page.waitForLoadState('networkidle')

    if (page.url().includes('/editar')) {
      console.log('  PJ já tem inscrição, verificando na edição')
    }

    await navigateToStepDados(page)

    // Ambos os campos DEVEM estar visíveis para PJ
    await expect(page.getByText(CAMPO_GERAL)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(CAMPO_PJ_ONLY)).toBeVisible({ timeout: 5000 })

    console.log('  PJ: ambos os campos visíveis')
  })

  // ── 4. ADMIN vê chips condicionais persistidos no formulário ──────
  test('4. ADMIN vê chips condicionais persistidos no edital', async ({ page }) => {
    test.skip(!editalId, 'Edital não foi criado no teste anterior')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    await page.goto(`/admin/editais/${editalId}`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain(CAMPO_GERAL)
    expect(body).toContain(CAMPO_PJ_ONLY)

    // Campo 2 (PJ/MEI only) — chips PJ e MEI devem estar ativos
    await expect(
      page.getByRole('button', { name: 'Pessoa Jurídica', exact: true }).nth(1)
    ).toHaveClass(/bg-brand-600/)
    await expect(
      page.getByRole('button', { name: 'MEI', exact: true }).nth(1)
    ).toHaveClass(/bg-brand-600/)

    // Campo 1 (geral) — nenhum chip ativo
    await expect(
      page.getByRole('button', { name: 'Pessoa Física', exact: true }).nth(0)
    ).not.toHaveClass(/bg-brand-600/)
    await expect(
      page.getByRole('button', { name: 'Pessoa Jurídica', exact: true }).nth(0)
    ).not.toHaveClass(/bg-brand-600/)

    console.log('  Admin: chips condicionais persistidos corretamente')
  })
})

// ─── Helper ─────────────────────────────────────────────────────────

async function navigateToStepDados(page: import('@playwright/test').Page) {
  // Se estiver na etapa de categoria, avançar
  const stepCategoria = page.getByText('Selecione a Categoria')
  if (await stepCategoria.isVisible({ timeout: 2000 }).catch(() => false)) {
    const catSelect = page.locator('select').first()
    const opts = await catSelect.locator('option').allTextContents()
    if (opts.length > 1) await catSelect.selectOption({ index: 1 })
    await page.getByRole('button', { name: /próximo/i }).click()
    await page.waitForTimeout(500)
  }

  // Garantir que estamos na etapa de dados
  const dadosVisible = await page.getByText('Dados do Projeto').first()
    .isVisible({ timeout: 2000 }).catch(() => false)
  if (!dadosVisible) {
    const btn = page.getByRole('button', { name: /próximo/i })
    if (await btn.count() > 0) {
      await btn.click()
      await page.waitForTimeout(500)
    }
  }
}
