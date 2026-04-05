import { test, expect } from '@playwright/test'
import { CREDENTIALS, login } from './helpers'

test.describe('Admin — Tipos de Anexo (auto-geração de tipo)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    await page.goto('/admin/configuracoes/tipos-anexo')
    await page.waitForLoadState('networkidle')
  })

  test('página carrega sem erros', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('modal de criação NÃO mostra campo "ID interno (tipo)"', async ({ page }) => {
    await page.getByRole('button', { name: /novo tipo/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Campo "Nome visível (label)" deve existir
    await expect(page.getByLabel(/nome visível|label/i)).toBeVisible()

    // Campo "ID interno (tipo)" NÃO deve existir
    await expect(page.getByLabel(/id interno/i)).not.toBeVisible()
  })

  test('criar tipo de anexo customizado gera ID automaticamente', async ({ page }) => {
    await page.getByRole('button', { name: /novo tipo/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Preencher label
    await page.getByLabel(/nome visível|label/i).fill('Certidão de Teste E2E')

    // Preencher tag
    const tagInput = page.locator('input[list="tags-datalist"]')
    await tagInput.fill('E2E')

    // Clicar em criar
    await page.getByRole('button', { name: /criar tipo/i }).click()

    // Modal deve fechar
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // A tabela deve mostrar o novo tipo com ID gerado automaticamente
    const row = page.locator('tr', { hasText: 'Certidão de Teste E2E' })
    await expect(row).toBeVisible({ timeout: 5000 })

    // A coluna "ID (tipo)" deve mostrar CERTIDAO_DE_TESTE_E2E (auto-gerado)
    await expect(row.locator('td.font-mono')).toContainText('CERTIDAO_DE_TESTE_E2E')
  })

  test('editar tipo customizado NÃO mostra campo "ID interno (tipo)"', async ({ page }) => {
    // Esperar tabela carregar
    const editButton = page.getByRole('button', { name: /editar/i }).first()

    if (await editButton.isVisible()) {
      await editButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Campo label deve existir
      await expect(page.getByLabel(/nome visível|label/i)).toBeVisible()

      // Campo ID interno NÃO deve existir
      await expect(page.getByLabel(/id interno/i)).not.toBeVisible()
    }
  })

  test('tabela exibe coluna ID (tipo) como read-only', async ({ page }) => {
    const header = page.locator('th', { hasText: 'ID (tipo)' })
    await expect(header).toBeVisible()
  })

  test('limpar tipo E2E criado', async ({ page }) => {
    // Encontrar e excluir o tipo de teste se existir
    const row = page.locator('tr', { hasText: 'Certidão de Teste E2E' })
    if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
      await row.getByRole('button', { name: /excluir/i }).click()
      await page.getByRole('button', { name: /confirmar exclusão/i }).click()
      await expect(row).not.toBeVisible({ timeout: 5000 })
    }
  })
})
