import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

test.describe('Desempate Manual', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
  })

  test('admin vê indicador de empate na tela de resultados quando há empates', async ({ page }) => {
    // Navega para lista de editais
    await page.goto('/admin/editais')
    await page.waitForLoadState('networkidle')

    // Procura um edital com resultados publicados
    const editalLink = page.locator('a[href*="/admin/editais/"]').first()
    if (await editalLink.count() === 0) {
      test.skip(true, 'Nenhum edital disponível para teste')
      return
    }

    await editalLink.click()
    await page.waitForLoadState('networkidle')

    // Navega para resultados
    const resultadosLink = page.locator('a[href*="/resultados"]')
    if (await resultadosLink.count() === 0) {
      test.skip(true, 'Link de resultados não encontrado')
      return
    }

    await resultadosLink.click()
    await page.waitForLoadState('networkidle')

    // Verifica se a página carregou
    await expect(page.locator('h1')).toContainText('Resultados')

    // Se houver empates, verifica o badge
    const empateBadge = page.locator('text=Empate')
    if (await empateBadge.count() > 0) {
      await expect(empateBadge.first()).toBeVisible()
    }
  })

  test('painel de desempate aparece somente quando há empates', async ({ page }) => {
    await page.goto('/admin/editais')
    await page.waitForLoadState('networkidle')

    const editalLink = page.locator('a[href*="/admin/editais/"]').first()
    if (await editalLink.count() === 0) {
      test.skip(true, 'Nenhum edital disponível para teste')
      return
    }

    await editalLink.click()
    await page.waitForLoadState('networkidle')

    const resultadosLink = page.locator('a[href*="/resultados"]')
    if (await resultadosLink.count() === 0) {
      test.skip(true, 'Link de resultados não encontrado')
      return
    }

    await resultadosLink.click()
    await page.waitForLoadState('networkidle')

    // O painel de desempate só deve existir quando há empates
    const tiebreakerPanel = page.locator('text=Desempate Manual')
    const empateBadge = page.locator('text=Empate')

    if (await empateBadge.count() > 0) {
      // Se há empates, o painel deve estar visível
      await expect(tiebreakerPanel).toBeVisible()
      // Deve haver um botão de salvar ordem
      await expect(page.locator('button:has-text("Salvar Ordem")')).toBeVisible()
    } else {
      // Se não há empates, o painel não deve aparecer
      await expect(tiebreakerPanel).toHaveCount(0)
    }
  })

  test('formulário de edital não mostra regras de desempate automático', async ({ page }) => {
    await page.goto('/admin/editais')
    await page.waitForLoadState('networkidle')

    const editalLink = page.locator('a[href*="/admin/editais/"]').first()
    if (await editalLink.count() === 0) {
      test.skip(true, 'Nenhum edital disponível para teste')
      return
    }

    await editalLink.click()
    await page.waitForLoadState('networkidle')

    // Verifica que não há seção de regras de desempate automático
    await expect(page.locator('text=Regras de Desempate')).toHaveCount(0)
    await expect(page.locator('text=+ Adicionar regra')).toHaveCount(0)

    // Verifica que há o texto informativo sobre desempate manual
    const desempateInfo = page.locator('text=o administrador define a ordem manualmente')
    if (await desempateInfo.count() > 0) {
      await expect(desempateInfo).toBeVisible()
    }
  })
})
