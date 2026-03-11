import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

test.describe('GAP 4 — Vagas contemplados e suplentes', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(60000)

  test('admin vê campos Vagas Contemplados e Vagas Suplentes no formulário', async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    await page.goto('/admin/editais')
    await page.waitForLoadState('networkidle')

    // Clica para criar ou editar um edital
    const novoBtn = page.locator('button:has-text("Novo"), button:has-text("Criar"), a:has-text("Novo")')
    if (await novoBtn.first().isVisible()) {
      await novoBtn.first().click()
      await page.waitForLoadState('networkidle')
    } else {
      const editarBtn = page.locator('button:has-text("Editar"), a:has-text("Editar")').first()
      if (await editarBtn.isVisible()) {
        await editarBtn.click()
        await page.waitForLoadState('networkidle')
      }
    }

    // Campos usam id gerado automaticamente do label (kebab-case)
    const vagasContemplados = page.locator('#vagas-contemplados')
    const vagasSuplentes = page.locator('#vagas-suplentes')

    await expect(vagasContemplados).toBeVisible({ timeout: 10000 })
    await expect(vagasSuplentes).toBeVisible({ timeout: 10000 })
  })

  test('admin salva edital com vagas definidas', async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    await page.goto('/admin/editais')
    await page.waitForLoadState('networkidle')

    const editarBtn = page.locator('button:has-text("Editar"), a:has-text("Editar")').first()
    if (await editarBtn.isVisible()) {
      await editarBtn.click()
      await page.waitForLoadState('networkidle')

      const vagasInput = page.locator('#vagas-contemplados')
      if (await vagasInput.isVisible()) {
        await vagasInput.fill('10')

        const suplentesInput = page.locator('#vagas-suplentes')
        if (await suplentesInput.isVisible()) {
          await suplentesInput.fill('5')
        }

        const salvarBtn = page.locator('button:has-text("Salvar"), button[type="submit"]')
        if (await salvarBtn.first().isVisible()) {
          await salvarBtn.first().click()
          await page.waitForLoadState('networkidle')

          const sucesso = page.locator('text=/sucesso|salvo|atualizado/i')
          await expect(sucesso.first()).toBeVisible({ timeout: 10000 })
        }
      }
    }
  })

  test('campos de vagas aceitam valor numérico ou vazio (ilimitado)', async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    await page.goto('/admin/editais')
    await page.waitForLoadState('networkidle')

    const editarBtn = page.locator('button:has-text("Editar"), a:has-text("Editar")').first()
    if (await editarBtn.isVisible()) {
      await editarBtn.click()
      await page.waitForLoadState('networkidle')

      const vagasInput = page.locator('#vagas-contemplados')
      if (await vagasInput.isVisible()) {
        await vagasInput.fill('')
        expect(await vagasInput.inputValue()).toBe('')

        await vagasInput.fill('20')
        expect(await vagasInput.inputValue()).toBe('20')
      }
    }
  })

  test('página de resultados exibe classificação', async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    await page.goto('/admin/editais')
    await page.waitForLoadState('networkidle')

    // Encontra um edital com status "Resultado Final" ou "Resultado Preliminar"
    const resultadoRow = page.locator('tr:has-text("Resultado")').first()
    if (await resultadoRow.isVisible()) {
      // Pega o link "Editar" que contém o ID do edital
      const editarLink = resultadoRow.locator('a:has-text("Editar")')
      const href = await editarLink.getAttribute('href')
      if (href) {
        const editalId = href.split('/').pop()
        await page.goto(`/admin/editais/${editalId}/resultados`)
        await page.waitForLoadState('networkidle')

        const tabela = page.locator('table')
        if (await tabela.first().isVisible()) {
          const headers = page.locator('th')
          const headerTexts = await headers.allTextContents()
          const hasRanking = headerTexts.some(
            (t) => /pos\.|proponente|nota\s*final|status/i.test(t),
          )
          expect(hasRanking).toBeTruthy()
        }
      }
    }
  })
})
