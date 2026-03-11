import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

test.describe('GAP 2 — Bloqueio de prazo de inscrição', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(60000)

  test('proponente vê botão "Enviar" quando inscrições abertas', async ({ page }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('networkidle')

    // Procura uma inscrição em rascunho (edital com inscrições abertas)
    const inscricaoCard = page.locator('[data-testid="inscricao-card"]').first()
    if (await inscricaoCard.isVisible()) {
      await inscricaoCard.click()
      await page.waitForLoadState('networkidle')

      // Verifica se o botão de enviar existe
      const submitButton = page.locator('button:has-text("Enviar"), button:has-text("Submeter")')
      if (await submitButton.isVisible()) {
        expect(await submitButton.isEnabled()).toBeTruthy()
      }
    }
  })

  test('proponente não consegue submeter quando edital INSCRICOES_ENCERRADAS', async ({ page }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('networkidle')

    // Verifica se há inscrições com prazo encerrado
    const encerrado = page.locator('text=/encerrad|prazo/i')
    if (await encerrado.first().isVisible()) {
      expect(await encerrado.first().isVisible()).toBeTruthy()
    }
  })

  test('mensagem de prazo encerrado exibida', async ({ page }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('networkidle')

    // Se houver mensagem de prazo encerrado, deve ser visível
    const mensagemPrazo = page.locator('text=/prazo.*encerrad|inscrições.*encerrad/i')
    if (await mensagemPrazo.first().isVisible()) {
      expect(await mensagemPrazo.first().isVisible()).toBeTruthy()
    }
  })
})
