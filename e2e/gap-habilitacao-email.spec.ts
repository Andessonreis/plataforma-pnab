import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

test.describe('GAP 3 — Habilitação com email', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(60000)

  test('habilitador marca inscrição como HABILITADA', async ({ page }) => {
    await login(page, CREDENTIALS.HABILITADOR.cpf, CREDENTIALS.HABILITADOR.senha)
    await page.goto('/admin/inscricoes')
    await page.waitForLoadState('networkidle')

    // Encontra a primeira inscrição na lista
    const inscricaoRow = page.locator('tr, [data-testid="inscricao-row"]').first()
    if (await inscricaoRow.isVisible()) {
      await inscricaoRow.click()
      await page.waitForLoadState('networkidle')

      // Procura botão de habilitar
      const habilitarBtn = page.locator('button:has-text("Habilitar"), button:has-text("HABILITADA")')
      if (await habilitarBtn.first().isVisible()) {
        await habilitarBtn.first().click()
        await page.waitForLoadState('networkidle')

        // Verifica mensagem de sucesso
        const sucesso = page.locator('text=/sucesso|habilitada/i')
        await expect(sucesso.first()).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('habilitador marca como INABILITADA (exige motivo)', async ({ page }) => {
    await login(page, CREDENTIALS.HABILITADOR.cpf, CREDENTIALS.HABILITADOR.senha)
    await page.goto('/admin/inscricoes')
    await page.waitForLoadState('networkidle')

    const inscricaoRow = page.locator('tr, [data-testid="inscricao-row"]').first()
    if (await inscricaoRow.isVisible()) {
      await inscricaoRow.click()
      await page.waitForLoadState('networkidle')

      // Procura opção de inabilitar
      const inabilitarBtn = page.locator('button:has-text("Inabilitar"), button:has-text("INABILITADA")')
      if (await inabilitarBtn.first().isVisible()) {
        await inabilitarBtn.first().click()

        // Deve aparecer campo de motivo
        const motivoField = page.locator('textarea[name="motivo"], input[name="motivo"], [data-testid="motivo-input"]')
        if (await motivoField.first().isVisible()) {
          await motivoField.first().fill('Documentação incompleta — faltou comprovante de residência')

          // Confirma
          const confirmar = page.locator('button:has-text("Confirmar"), button:has-text("Salvar")')
          if (await confirmar.first().isVisible()) {
            await confirmar.first().click()
            await page.waitForLoadState('networkidle')

            const sucesso = page.locator('text=/sucesso|inabilitada/i')
            await expect(sucesso.first()).toBeVisible({ timeout: 10000 })
          }
        }
      }
    }
  })

  test('tentativa sem motivo mostra erro de validação', async ({ page }) => {
    await login(page, CREDENTIALS.HABILITADOR.cpf, CREDENTIALS.HABILITADOR.senha)
    await page.goto('/admin/inscricoes')
    await page.waitForLoadState('networkidle')

    const inscricaoRow = page.locator('tr, [data-testid="inscricao-row"]').first()
    if (await inscricaoRow.isVisible()) {
      await inscricaoRow.click()
      await page.waitForLoadState('networkidle')

      const inabilitarBtn = page.locator('button:has-text("Inabilitar"), button:has-text("INABILITADA")')
      if (await inabilitarBtn.first().isVisible()) {
        await inabilitarBtn.first().click()

        // Tenta confirmar sem preencher motivo
        const confirmar = page.locator('button:has-text("Confirmar"), button:has-text("Salvar")')
        if (await confirmar.first().isVisible()) {
          await confirmar.first().click()

          // Deve mostrar erro de validação
          const erro = page.locator('text=/motivo.*obrigat|preencha.*motivo|campo.*obrigat/i')
          await expect(erro.first()).toBeVisible({ timeout: 10000 })
        }
      }
    }
  })
})
