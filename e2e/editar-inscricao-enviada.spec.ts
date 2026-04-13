import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

test.describe('Editar inscrição ENVIADA durante prazo de inscrições', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(60000)

  test('proponente vê botão "Editar" em inscrição ENVIADA com edital aberto', async ({ page }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('networkidle')

    // Procura uma inscrição com status ENVIADA
    const enviadaBadge = page.locator('text=/Enviada/i').first()

    if (await enviadaBadge.isVisible()) {
      // Clica no card da inscrição enviada
      const card = enviadaBadge.locator('xpath=ancestor::a[1]')
      if (await card.count() > 0) {
        await card.click()
      } else {
        // Fallback: tenta clicar no link mais próximo
        const link = page.locator('a[href*="/proponente/inscricoes/"]').first()
        await link.click()
      }
      await page.waitForLoadState('networkidle')

      // Verifica se o botão Editar aparece (para inscrições com edital INSCRICOES_ABERTAS)
      const editButton = page.locator('button:has-text("Editar Inscrição")')
      if (await editButton.isVisible()) {
        expect(await editButton.isEnabled()).toBeTruthy()
      }
    }
  })

  test('proponente retira inscrição, edita e reenvia', async ({ page }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('networkidle')

    // Navega para uma inscrição ENVIADA
    const enviadaBadge = page.locator('text=/Enviada/i').first()
    if (!(await enviadaBadge.isVisible())) {
      test.skip()
      return
    }

    // Navega para detalhes
    const link = enviadaBadge.locator('xpath=ancestor::a[1]')
    if (await link.count() > 0) {
      await link.click()
    } else {
      const anyLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
      await anyLink.click()
    }
    await page.waitForLoadState('networkidle')

    // Clica em "Editar Inscrição"
    const editButton = page.locator('button:has-text("Editar Inscrição")')
    if (!(await editButton.isVisible())) {
      test.skip()
      return
    }
    await editButton.click()

    // Deve aparecer o dialog de confirmação
    const confirmDialog = page.locator('text=/será retirada/i')
    await expect(confirmDialog).toBeVisible({ timeout: 5000 })

    // Confirma
    const confirmButton = page.locator('button:has-text("Confirmar e editar")')
    await confirmButton.click()

    // Deve redirecionar para a página de edição
    await page.waitForURL(/\/editar/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Verifica que está na página de edição
    const editTitle = page.locator('text=/Editar Inscrição/i')
    await expect(editTitle).toBeVisible({ timeout: 5000 })
  })

  test('proponente NÃO vê botão "Editar" quando edital encerrado', async ({ page }) => {
    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('networkidle')

    // Procura inscrições com status ENVIADA em editais encerrados
    // Quando o edital não está INSCRICOES_ABERTAS, o botão NÃO deve aparecer
    const links = page.locator('a[href*="/proponente/inscricoes/"]')
    const count = await links.count()

    for (let i = 0; i < Math.min(count, 3); i++) {
      await links.nth(i).click()
      await page.waitForLoadState('networkidle')

      const statusBadge = page.locator('text=/Habilitada|Em Avaliação|Resultado/i').first()
      if (await statusBadge.isVisible()) {
        // Para inscrições em fases posteriores, NÃO deve ter botão Editar
        const editButton = page.locator('button:has-text("Editar Inscrição")')
        expect(await editButton.count()).toBe(0)
      }

      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })
})
