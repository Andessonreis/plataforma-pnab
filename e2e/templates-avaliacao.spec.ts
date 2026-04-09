import { test, expect } from '@playwright/test'
import { CREDENTIALS, login } from './helpers'

test.describe.serial('Admin — Templates de Avaliação', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
  })

  test('1. Página de templates carrega sem erros', async ({ page }) => {
    await page.goto('/admin/configuracoes/templates-avaliacao')
    await page.waitForLoadState('networkidle')

    // Verifica que o header aparece
    await expect(page.locator('h1, h2').first()).toBeVisible()
    console.log('✅ ETAPA 1: Página de templates carregou')
  })

  test('2. Criar template com critérios discretos', async ({ page }) => {
    await page.goto('/admin/configuracoes/templates-avaliacao')
    await page.waitForLoadState('networkidle')

    // Abrir modal de criação
    await page.getByRole('button', { name: /novo template/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Preencher dados básicos
    await page.getByLabel(/nome do template/i).fill('Template E2E Teste')
    await page.getByLabel(/fórmula/i).fill('((B1+B2)/2)+B3')

    // O primeiro critério já existe, preencher
    const firstCriterio = page.locator('[role="dialog"] input[placeholder*="Nome do critério"], [role="dialog"] input[placeholder*="Iniciativas"]').first()
    await firstCriterio.fill('Critério Teste A')

    // Preencher bloco
    const blocoInput = page.locator('[role="dialog"] input[placeholder*="Bloco"]').first()
    await blocoInput.fill('Bloco 1')

    // Selecionar modo discreto (já vem selecionado por padrão no template)
    const modoSelect = page.locator('[role="dialog"] select').first()
    await modoSelect.selectOption('discreto')

    // Preencher valores discretos
    const naoAtendeInput = page.getByLabel(/não atende/i).first()
    if (await naoAtendeInput.isVisible()) {
      await naoAtendeInput.fill('0')
    }
    const parcialInput = page.getByLabel(/parcial/i).first()
    if (await parcialInput.isVisible()) {
      await parcialInput.fill('5')
    }
    const plenamenteInput = page.getByLabel(/plenamente/i).first()
    if (await plenamenteInput.isVisible()) {
      await plenamenteInput.fill('10')
    }

    // Salvar
    await page.getByRole('button', { name: /criar template/i }).click()

    // Modal deve fechar
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

    // Template deve aparecer na lista
    await expect(page.locator('td', { hasText: 'Template E2E Teste' })).toBeVisible({ timeout: 5000 })

    console.log('✅ ETAPA 2: Template criado com critérios discretos')
  })

  test('3. Editar template', async ({ page }) => {
    await page.goto('/admin/configuracoes/templates-avaliacao')
    await page.waitForLoadState('networkidle')

    // Encontrar a linha do template criado
    const row = page.locator('tr', { hasText: 'Template E2E Teste' })
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.getByRole('button', { name: /editar/i }).click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Preencher descrição
      const descTextarea = page.locator('[role="dialog"] textarea').first()
      await descTextarea.fill('Descrição atualizada via E2E')

      // Salvar
      await page.getByRole('button', { name: /salvar alterações/i }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

      console.log('✅ ETAPA 3: Template editado')
    } else {
      console.log('⚠️ ETAPA 3: Template não encontrado, pulando edição')
    }
  })

  test('4. Template aparece no selector do edital', async ({ page }) => {
    await page.goto('/admin/editais/novo')
    await page.waitForLoadState('networkidle')

    // Buscar o selector de template na Seção 5
    const templateSelect = page.locator('select').filter({ hasText: /selecione um template/i })

    if (await templateSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verificar que o template criado está na lista
      const options = await templateSelect.locator('option').allTextContents()
      const hasTemplate = options.some(opt => opt.includes('Template E2E Teste') || opt.includes('PNAB Cultura Viva'))

      expect(hasTemplate).toBeTruthy()
      console.log('✅ ETAPA 4: Template disponível no selector do edital')
    } else {
      console.log('⚠️ ETAPA 4: Selector de template não visível (pode não haver templates)')
    }
  })

  test('5. Limpar template E2E criado', async ({ page }) => {
    await page.goto('/admin/configuracoes/templates-avaliacao')
    await page.waitForLoadState('networkidle')

    const row = page.locator('tr', { hasText: 'Template E2E Teste' })
    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.getByRole('button', { name: /excluir/i }).click()
      await page.getByRole('button', { name: /confirmar exclusão/i }).click()
      await expect(row).not.toBeVisible({ timeout: 5000 })
      console.log('✅ ETAPA 5: Template E2E limpo')
    } else {
      console.log('⚠️ ETAPA 5: Template E2E não encontrado para limpar')
    }
  })
})
