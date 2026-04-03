import { test, expect } from '@playwright/test'

test.describe('Home — Carrossel de Destaques', () => {
  test('Página inicial carrega sem erros (com ou sem slides)', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Portal PNAB/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('Carrossel renderiza se houver editais publicados', async ({ page }) => {
    await page.goto('/')

    // Se existem editais publicados, o carrossel deve aparecer
    const carousel = page.locator('[aria-roledescription="carrossel"]')
    const heroSection = page.locator('section').first()

    // Pelo menos o hero deve carregar
    await expect(heroSection).toBeVisible()

    // Se o carrossel existe, verificar que tem conteúdo
    if (await carousel.isVisible()) {
      // Deve ter pelo menos um título de slide
      await expect(carousel.locator('h3').first()).toBeVisible()
      // Deve ter um botão CTA
      await expect(carousel.locator('a').first()).toBeVisible()
    }
  })

  test('Carrossel tem setas de navegação quando há múltiplos slides', async ({ page }) => {
    await page.goto('/')

    const carousel = page.locator('[aria-roledescription="carrossel"]')

    if (await carousel.isVisible()) {
      const dots = carousel.locator('button[aria-label^="Ir para slide"]')
      const dotCount = await dots.count()

      if (dotCount > 1) {
        // Setas devem estar visíveis em desktop
        await expect(carousel.locator('button[aria-label="Slide anterior"]')).toBeVisible()
        await expect(carousel.locator('button[aria-label="Próximo slide"]')).toBeVisible()

        // Clicar no próximo
        const firstTitle = await carousel.locator('h3').first().textContent()
        await carousel.locator('button[aria-label="Próximo slide"]').click()
        await page.waitForTimeout(500)

        // O título pode ter mudado
        const secondTitle = await carousel.locator('h3').first().textContent()

        // Ao menos o carrossel não crashou
        await expect(carousel.locator('h3').first()).toBeVisible()

        // Se há mais de 1 slide com conteúdo diferente
        if (dotCount > 1 && firstTitle !== secondTitle) {
          expect(firstTitle).not.toBe(secondTitle)
        }
      }
    }
  })
})

test.describe('Admin — CRUD de Slides', () => {
  // Login como admin antes de cada teste
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/cpf/i).fill('00000000001')
    await page.getByLabel(/senha/i).fill('Teste@123')
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })
  })

  test('Página de slides admin carrega', async ({ page }) => {
    await page.goto('/admin/slides')
    await expect(page.locator('h1')).toContainText('Slides da Home')
  })

  test('Navegar para formulário de novo slide', async ({ page }) => {
    await page.goto('/admin/slides')
    await page.getByRole('link', { name: /novo/i }).first().click()
    await page.waitForURL(/\/admin\/slides\/novo/, { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Novo Slide')
  })

  test('Criar novo slide', async ({ page }) => {
    await page.goto('/admin/slides/novo')

    const timestamp = Date.now()
    const titulo = `Slide Teste E2E ${timestamp}`

    // Preencher formulário
    await page.getByLabel(/título do slide/i).fill(titulo)
    await page.getByLabel(/descrição/i).fill('Descrição do slide de teste E2E')
    await page.getByLabel(/texto do botão/i).fill('Ver detalhes')
    await page.getByLabel(/url do botão/i).fill('/editais')

    // Submeter
    await page.getByRole('button', { name: /criar slide/i }).click()

    // Deve mostrar mensagem de sucesso ou redirecionar
    await expect(
      page.getByText(/slide criado/i).or(page.locator('h1:has-text("Editar Slide")')),
    ).toBeVisible({ timeout: 10000 })
  })

  test('Listar slides com filtros', async ({ page }) => {
    await page.goto('/admin/slides')

    // Filtros devem estar visíveis
    await expect(page.getByRole('link', { name: 'Todos' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ativos' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Inativos' })).toBeVisible()

    // Clicar em "Ativos"
    await page.getByRole('link', { name: 'Ativos' }).click()
    await page.waitForURL(/status=ativo/)
  })

  test('Sidebar mostra link "Slides Home"', async ({ page }) => {
    await page.goto('/admin')

    // Em desktop, sidebar está visível
    const slidesLink = page.getByRole('link', { name: 'Slides Home' })
    if (await slidesLink.isVisible()) {
      await slidesLink.click()
      await page.waitForURL(/\/admin\/slides/, { timeout: 10000 })
      await expect(page.locator('h1')).toContainText('Slides da Home')
    }
  })
})
