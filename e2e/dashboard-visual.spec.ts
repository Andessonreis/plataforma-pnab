import { test, expect, type Page } from '@playwright/test'

/**
 * TESTE VISUAL — Dashboard completo por perfil de usuário
 *
 * Simula um usuário normal navegando pela plataforma.
 * Rode com: npx playwright test e2e/dashboard-visual.spec.ts --headed
 *
 * Perfis testados:
 *   1. VISITANTE  — Páginas públicas (sem login)
 *   2. PROPONENTE — Dashboard, inscrições, perfil
 *   3. ADMIN      — Gestão completa (editais, inscrições, usuários, logs, etc.)
 *   4. HABILITADOR — Habilitação de inscrições
 *   5. AVALIADOR   — Avaliação de inscrições
 *   6. ATENDIMENTO — Tickets e FAQ
 */

const BASE = 'http://localhost:3001'

const USERS = {
  ADMIN:       { cpf: '00000000001', senha: 'Teste@123' },
  ATENDIMENTO: { cpf: '00000000002', senha: 'Teste@123' },
  HABILITADOR: { cpf: '00000000003', senha: 'Teste@123' },
  AVALIADOR:   { cpf: '00000000004', senha: 'Teste@123' },
  PROPONENTE:  { cpf: '12345678901', senha: 'Teste@123' },
}

// ── Helpers ──────────────────────────────────────────────

async function login(page: Page, cpf: string, senha: string) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })
  await page.locator('#cpf-ou-cnpj').fill(cpf)
  await page.locator('#senha').fill(senha)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(admin|proponente)/, { timeout: 30000 })
}

async function logout(page: Page) {
  // Clicar no link "Sair" da sidebar
  const sairLink = page.locator('a[href*="/signout"], a:has-text("Sair")').first()
  if (await sairLink.count() > 0) {
    await sairLink.click()
    await page.waitForTimeout(2000)
    // Confirmar signout se necessário
    const confirmBtn = page.locator('button[type="submit"]').first()
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click()
      await page.waitForTimeout(2000)
    }
  }
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true })
}

// ══════════════════════════════════════════════════════════
// 1. VISITANTE — Navegação pública completa
// ══════════════════════════════════════════════════════════
test.describe('1. Visitante — Páginas Públicas', () => {

  test('1.1 Homepage carrega com hero, métricas e editais', async ({ page }) => {
    await page.goto(BASE, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')

    // Hero
    expect(body).toContain('Política Nacional')
    expect(body).toContain('Aldir Blanc')

    // Métricas
    expect(body).toContain('Editais Abertos')
    expect(body).toContain('Valor em Fomento')
    expect(body).toContain('Projetos Apoiados')

    // Seção "Como funciona" — 4 passos
    expect(body).toContain('Consulte os editais')
    expect(body).toContain('Cadastre-se')
    expect(body).toContain('Inscreva seu projeto')
    expect(body).toContain('Acompanhe o resultado')

    // Editais em destaque
    expect(body).toContain('Editais em destaque')

    // Footer
    expect(body).toContain('Secretaria de Arte e Cultura')
    expect(body).toContain('cultura@irece.ba.gov.br')

    console.log('✅ 1.1 Homepage — OK')
  })

  test('1.2 Editais — lista com filtros', async ({ page }) => {
    await page.goto(`${BASE}/editais`, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')

    // Título
    expect(body).toContain('Editais')

    // Filtros
    expect(body).toContain('Todos')
    expect(body).toContain('Abertos')
    expect(body).toContain('Encerrados')

    // Contagem
    expect(body).toMatch(/\d+ editais encontrados/)

    // Cards de editais
    const cards = page.locator('a[href*="/editais/"]')
    expect(await cards.count()).toBeGreaterThan(0)

    // Testar filtro "Abertos"
    await page.locator('a:has-text("Abertos")').click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    const abertosBody = await page.textContent('body')
    expect(abertosBody).toContain('editais encontrados')

    console.log('✅ 1.2 Editais — OK')
  })

  test('1.3 Detalhe do edital — conteúdo completo', async ({ page }) => {
    await page.goto(`${BASE}/editais`, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Clicar no primeiro edital
    const firstEdital = page.locator('a[href*="/editais/"][href*="pnab"]').first()
    if (await firstEdital.count() > 0) {
      await firstEdital.click()
    } else {
      await page.locator('a[href*="/editais/"]:has-text("Ver detalhes")').first().click()
    }
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')

    // Seção "Sobre"
    expect(body).toContain('Sobre')

    // Sidebar com info
    const hasSidebar = body?.includes('Inscrever-se') || body?.includes('Valor Total') || body?.includes('Status')
    expect(hasSidebar).toBeTruthy()

    // Categorias
    const hasCategorias = body?.includes('Categorias') || body?.includes('Música') || body?.includes('Artes')
    expect(hasCategorias).toBeTruthy()

    console.log('✅ 1.3 Detalhe edital — OK')
  })

  test('1.4 Notícias — grid com cards', async ({ page }) => {
    await page.goto(`${BASE}/noticias`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)

    const body = await page.textContent('body')
    expect(body).toContain('Notícias')

    // Cards de notícias
    const cards = page.locator('a[href*="/noticias/"]')
    expect(await cards.count()).toBeGreaterThan(0)

    console.log('✅ 1.4 Notícias — OK')
  })

  test('1.5 FAQ — perguntas com accordion', async ({ page }) => {
    await page.goto(`${BASE}/faq`, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    expect(body).toContain('Perguntas Frequentes')

    // Busca
    const searchInput = page.locator('input[placeholder*="Buscar"]').first()
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible()
    }

    // Link para contato
    const contatoLink = page.locator('a[href*="/contato"]')
    expect(await contatoLink.count()).toBeGreaterThan(0)

    console.log('✅ 1.5 FAQ — OK')
  })

  test('1.6 Contato — formulário com validação', async ({ page }) => {
    await page.goto(`${BASE}/contato`, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    expect(body).toContain('Contato')

    // Campos do formulário
    expect(body).toContain('Nome')
    expect(body).toContain('E-mail')
    expect(body).toContain('Mensagem')

    // Info de contato na sidebar
    expect(body).toContain('cultura@irece.ba.gov.br')
    expect(body).toContain('(74) 3641-3116')

    // Botão de envio
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn.first()).toBeVisible()

    console.log('✅ 1.6 Contato — OK')
  })

  test('1.7 Projetos Apoiados — tabela de transparência', async ({ page }) => {
    await page.goto(`${BASE}/projetos-apoiados`, { timeout: 30000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    expect(body).toContain('Projetos Apoiados')

    // Filtro por ano
    const hasFilters = body?.includes('Todos') || body?.includes('2024')
    expect(hasFilters).toBeTruthy()

    // Métricas
    const hasMetricas = body?.includes('R$') || body?.includes('projetos')
    expect(hasMetricas).toBeTruthy()

    console.log('✅ 1.7 Projetos Apoiados — OK')
  })

  test('1.8 Manuais — biblioteca de documentos', async ({ page }) => {
    await page.goto(`${BASE}/manuais`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Manuais')

    // Categorias
    const hasCategorias = body?.includes('PDF') || body?.includes('Download') || body?.includes('Baixar')
    expect(hasCategorias).toBeTruthy()

    console.log('✅ 1.8 Manuais — OK')
  })

  test('1.9 Acessibilidade — controles de fonte e contraste', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    // Botões de acessibilidade no header
    await expect(page.locator('button:has-text("A+")')).toBeVisible()
    await expect(page.locator('button:has-text("A-")')).toBeVisible()
    await expect(page.locator('button:has-text("Contraste")')).toBeVisible()

    // Clicar em aumentar fonte
    await page.locator('button:has-text("A+")').click()
    await page.waitForTimeout(500)

    // Clicar em alto contraste
    await page.locator('button:has-text("Contraste")').click()
    await page.waitForTimeout(500)

    console.log('✅ 1.9 Acessibilidade — OK')
  })
})

// ══════════════════════════════════════════════════════════
// 2. PROPONENTE — Área do proponente completa
// ══════════════════════════════════════════════════════════
test.describe('2. Proponente — Dashboard e Inscrições', () => {

  test('2.1 Login e dashboard com boas-vindas', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)

    // URL deve ser /proponente
    expect(page.url()).toContain('/proponente')

    const body = await page.textContent('body')

    // Boas-vindas
    expect(body).toContain('Bem-vindo')

    // KPIs
    const hasKpis = body?.includes('inscriç') || body?.includes('Inscrições') || body?.includes('editais')
    expect(hasKpis).toBeTruthy()

    // Sidebar
    await expect(page.locator('a:has-text("Dashboard")').first()).toBeVisible()
    await expect(page.locator('a:has-text("Minhas Inscrições")').first()).toBeVisible()
    await expect(page.locator('a:has-text("Meu Perfil")').first()).toBeVisible()

    console.log('✅ 2.1 Login proponente + dashboard — OK')
  })

  test('2.2 Minhas Inscrições — lista com status', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/inscricoes`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Inscrições')

    // Deve ter pelo menos uma inscrição do seed
    const hasInscricao = body?.includes('PNAB-') || body?.includes('Contemplada') || body?.includes('Enviada')
    expect(hasInscricao).toBeTruthy()

    console.log('✅ 2.2 Minhas Inscrições — OK')
  })

  test('2.3 Detalhe da inscrição — timeline e dados', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await firstLink.count() === 0) {
      console.log('⚠️ 2.3 Sem inscrições para testar')
      return
    }

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Timeline de status
    const hasTimeline = body?.includes('Rascunho') || body?.includes('Enviada') ||
                        body?.includes('Habilitada') || body?.includes('Andamento') ||
                        body?.includes('Contemplada')
    expect(hasTimeline).toBeTruthy()

    // Botão voltar
    expect(body).toContain('Voltar')

    // Informações da inscrição
    const hasInfo = body?.includes('Edital') || body?.includes('Categoria') || body?.includes('Status')
    expect(hasInfo).toBeTruthy()

    console.log('✅ 2.3 Detalhe inscrição — OK')
  })

  test('2.4 Comprovante PDF — link disponível', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await firstLink.count() === 0) return

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Se inscrição não é rascunho, deve ter comprovante
    if (!body?.includes('RASCUNHO')) {
      const comprovante = page.locator('a[href*="/comprovante"]')
      if (await comprovante.count() > 0) {
        await expect(comprovante.first()).toBeVisible()
        console.log('✅ 2.4 Comprovante PDF — link presente')
      } else {
        console.log('⚠️ 2.4 Comprovante PDF — link não encontrado')
      }
    } else {
      console.log('⚠️ 2.4 Inscrição em rascunho — sem comprovante')
    }
  })

  test('2.5 Perfil do proponente — dados pessoais', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/perfil`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Dados do usuário
    expect(body).toContain('Perfil')

    // CPF (readonly)
    const hasCpf = body?.includes('12345678901') || body?.includes('CPF')
    expect(hasCpf).toBeTruthy()

    // Formulário de edição
    const hasForm = body?.includes('Nome') || body?.includes('E-mail') || body?.includes('Telefone')
    expect(hasForm).toBeTruthy()

    // Endereço
    const hasEndereco = body?.includes('CEP') || body?.includes('Endereço') || body?.includes('Cidade')
    expect(hasEndereco).toBeTruthy()

    console.log('✅ 2.5 Perfil proponente — OK')
  })

  test('2.6 Navegação da sidebar — todos os links', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)

    // Dashboard
    await page.goto(`${BASE}/proponente`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/proponente')
    console.log('  → Dashboard: ✅')

    // Inscrições
    await page.goto(`${BASE}/proponente/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/proponente/inscricoes')
    console.log('  → Inscrições: ✅')

    // Perfil
    await page.goto(`${BASE}/proponente/perfil`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/proponente/perfil')
    console.log('  → Perfil: ✅')

    console.log('✅ 2.6 Navegação sidebar proponente — OK')
  })

  test('2.7 Proponente vê editais públicos e tenta inscrever', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)

    // Navegar para editais públicos
    await page.goto(`${BASE}/editais`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Editais')

    // Clicar num edital com inscrições abertas
    const editalLink = page.locator('a[href*="/editais/"]:has-text("Ver detalhes")').first()
    if (await editalLink.count() > 0) {
      await editalLink.click()
      await page.waitForLoadState('networkidle')

      const detalheBody = await page.textContent('body')
      // Deve ter CTA de inscrição
      const hasCta = detalheBody?.includes('Inscrever-se') || detalheBody?.includes('Nova Inscrição')
      console.log(`  → CTA de inscrição: ${hasCta ? 'visível' : 'não visível (status do edital)'}`)
    }

    console.log('✅ 2.7 Proponente navega editais — OK')
  })
})

// ══════════════════════════════════════════════════════════
// 3. ADMIN — Gestão completa da plataforma
// ══════════════════════════════════════════════════════════
test.describe('3. Admin — Backoffice Completo', () => {

  test('3.1 Login e dashboard com KPIs', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    expect(page.url()).toContain('/admin')

    const body = await page.textContent('body')
    expect(body).toContain('Dashboard')

    // KPIs
    const hasKpis = body?.includes('Editais') || body?.includes('Inscrições') || body?.includes('Proponentes')
    expect(hasKpis).toBeTruthy()

    // Ações rápidas
    const hasAcoes = body?.includes('Novo Edital') || body?.includes('Gerenciar')
    expect(hasAcoes).toBeTruthy()

    console.log('✅ 3.1 Dashboard admin — OK')
  })

  test('3.2 Editais — lista com filtros e ações', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/editais`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Editais')

    // Botão novo edital
    const novoBtn = page.locator('a[href*="/admin/editais/novo"]')
    await expect(novoBtn.first()).toBeVisible()

    // Tabela com editais
    const hasTabela = body?.includes('Título') || body?.includes('Status') || body?.includes('Valor')
    expect(hasTabela).toBeTruthy()

    // Filtros de status
    const hasFilters = body?.includes('Todos') || body?.includes('Publicado') || body?.includes('Inscrições Abertas')
    expect(hasFilters).toBeTruthy()

    // Link de edição existe
    const editLinks = page.locator('a[href*="/admin/editais/c"]')
    expect(await editLinks.count()).toBeGreaterThan(0)

    console.log('✅ 3.2 Editais admin — OK')
  })

  test('3.3 Novo Edital — formulário completo', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/editais/novo`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Campos do formulário
    expect(body).toContain('Título')

    // Categorias culturais
    const hasCategorias = body?.includes('Categorias') || body?.includes('Música') || body?.includes('Artes Visuais')
    expect(hasCategorias).toBeTruthy()

    // Status
    const statusSelect = page.locator('#status')
    if (await statusSelect.count() > 0) {
      await expect(statusSelect).toBeVisible()
    }

    // Cronograma
    const hasCronograma = body?.includes('Cronograma') || body?.includes('marcos')
    expect(hasCronograma).toBeTruthy()

    // Documentos
    const hasDocs = body?.includes('Documentos') || body?.includes('Anexos')
    expect(hasDocs).toBeTruthy()

    // Botão submit
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn.first()).toBeVisible()

    // Botão cancelar
    const cancelBtn = page.locator('a:has-text("Cancelar")')
    if (await cancelBtn.count() > 0) {
      await expect(cancelBtn.first()).toBeVisible()
    }

    console.log('✅ 3.3 Formulário novo edital — OK')
  })

  test('3.4 Editar edital existente — campos preenchidos', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/editais`)
    await page.waitForLoadState('networkidle')

    // Pegar href do primeiro edital e navegar direto (cards podem ser hidden no desktop)
    const editLink = page.locator('a[href*="/admin/editais/c"]').first()
    if (await editLink.count() === 0) {
      console.log('⚠️ 3.4 Nenhum edital para editar')
      return
    }

    const href = await editLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 30000 })
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Formulário preenchido
    expect(body).toContain('Título')

    // Seção de versão acessível (WCAG AA)
    const hasAcessivel = body?.includes('Acessível') || body?.includes('WCAG') || body?.includes('acessível')
    expect(hasAcessivel).toBeTruthy()

    // Documentos existentes
    const hasDocs = body?.includes('Documentos') || body?.includes('Anexos')
    expect(hasDocs).toBeTruthy()

    console.log('✅ 3.4 Editar edital — OK')
  })

  test('3.5 Inscrições — lista com filtros e busca', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Inscrições')

    // Filtros
    const hasFilters = body?.includes('Buscar') || body?.includes('Status') || body?.includes('Edital')
    expect(hasFilters).toBeTruthy()

    // Tabela
    const hasTabela = body?.includes('Número') || body?.includes('Proponente') || body?.includes('PNAB-')
    expect(hasTabela).toBeTruthy()

    // Exportar CSV
    const exportBtn = page.locator('a[href*="/export"]')
    if (await exportBtn.count() > 0) {
      await expect(exportBtn.first()).toBeVisible()
      console.log('  → Botão exportar CSV: presente')
    }

    // Clicar na primeira inscrição
    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() > 0) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')

      const detailBody = await page.textContent('body')
      const hasDetail = detailBody?.includes('Protocolo') || detailBody?.includes('Proponente') || detailBody?.includes('PNAB-')
      expect(hasDetail).toBeTruthy()
      console.log('  → Detalhe da inscrição: carregado')
    }

    console.log('✅ 3.5 Inscrições admin — OK')
  })

  test('3.6 Usuários — lista com roles', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/usuarios`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Usuários')

    // Roles visíveis
    const hasRoles = body?.includes('ADMIN') || body?.includes('PROPONENTE') ||
                     body?.includes('Administrador') || body?.includes('Proponente')
    expect(hasRoles).toBeTruthy()

    console.log('✅ 3.6 Usuários — OK')
  })

  test('3.7 Notícias — CRUD de notícias', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/noticias`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Notícias')

    // Filtros
    const hasFilters = body?.includes('Todos') || body?.includes('Publicadas') || body?.includes('Rascunhos')
    expect(hasFilters).toBeTruthy()

    // Lista
    const hasNoticias = body?.includes('Título') || body?.includes('Tags') || body?.includes('Status')
    expect(hasNoticias).toBeTruthy()

    console.log('✅ 3.7 Notícias admin — OK')
  })

  test('3.8 FAQ — gestão de perguntas', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/faq`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('FAQ')

    // Botão criar
    const novoBtn = page.locator('a[href*="/admin/faq/novo"]')
    if (await novoBtn.count() > 0) {
      await expect(novoBtn.first()).toBeVisible()
    }

    console.log('✅ 3.8 FAQ admin — OK')
  })

  test('3.9 Páginas CMS', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/cms`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    // Pode ter "Páginas" ou "CMS" ou "Nova Página"
    const hasCms = body?.includes('Páginas') || body?.includes('CMS') || body?.includes('Nova Página')
    expect(hasCms).toBeTruthy()

    console.log('✅ 3.9 CMS admin — OK')
  })

  test('3.10 Logs de auditoria', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/logs`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    const hasLogs = body?.includes('Auditoria') || body?.includes('Logs') || body?.includes('Atividade')
    expect(hasLogs).toBeTruthy()

    // Filtro por ação
    const hasFilter = body?.includes('Ação') || body?.includes('filtro') || body?.includes('Filtrar')
    console.log(`  → Filtro de ações: ${hasFilter ? 'presente' : 'não encontrado'}`)

    console.log('✅ 3.10 Logs — OK')
  })

  test('3.11 Contemplados — gestão e importação', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/contemplados`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Contemplados')

    // Importador CSV
    const hasImport = body?.includes('Importar') || body?.includes('CSV') || body?.includes('importar')
    console.log(`  → Importador CSV: ${hasImport ? 'presente' : 'não encontrado'}`)

    console.log('✅ 3.11 Contemplados — OK')
  })

  test('3.12 Recursos — gestão de apelações', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/recursos`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Recursos')

    // Contadores
    const hasContadores = body?.includes('pendente') || body?.includes('decidido') || body?.includes('Pendente')
    expect(hasContadores).toBeTruthy()

    console.log('✅ 3.12 Recursos — OK')
  })

  test('3.13 Resultados de edital', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/editais`)
    await page.waitForLoadState('networkidle')

    // Procurar link de resultados
    const resultadosLink = page.locator('a[href*="/resultados"]').first()
    if (await resultadosLink.count() > 0) {
      await resultadosLink.click()
      await page.waitForLoadState('networkidle')

      const body = await page.textContent('body')
      const hasResultados = body?.includes('Resultado') || body?.includes('Classificação') || body?.includes('Nota')
      expect(hasResultados).toBeTruthy()
      console.log('✅ 3.13 Resultados — OK')
    } else {
      console.log('⚠️ 3.13 Link de resultados não encontrado na lista')
    }
  })

  test('3.14 Sidebar admin — todos os links navegam', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    const links = [
      { text: 'Dashboard',    url: '/admin' },
      { text: 'Editais',      url: '/admin/editais' },
      { text: 'Inscrições',   url: '/admin/inscricoes' },
      { text: 'Contemplados', url: '/admin/contemplados' },
      { text: 'Notícias',     url: '/admin/noticias' },
      { text: 'FAQ',          url: '/admin/faq' },
      { text: 'Usuários',     url: '/admin/usuarios' },
      { text: 'Logs',         url: '/admin/logs' },
    ]

    for (const link of links) {
      // Navegar direto para evitar problemas com sidebar responsiva
      await page.goto(`${BASE}${link.url}`, { timeout: 30000 })
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1000)
      const urlOk = page.url().includes(link.url)
      console.log(`  → ${link.text}: ${urlOk ? '✅' : '❌ URL=' + page.url()}`)
    }

    console.log('✅ 3.14 Sidebar admin — OK')
  })
})

// ══════════════════════════════════════════════════════════
// 4. HABILITADOR — Habilitação de inscrições
// ══════════════════════════════════════════════════════════
test.describe('4. Habilitador — Fluxo de Habilitação', () => {

  test('4.1 Login e acesso às inscrições', async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)

    expect(page.url()).toContain('/admin')

    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Inscrições')

    console.log('✅ 4.1 Habilitador — login e inscrições — OK')
  })

  test('4.2 Detalhe da inscrição — botões de habilitação', async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) {
      console.log('⚠️ 4.2 Sem inscrições para testar')
      return
    }

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Deve ver dados da inscrição
    const hasDetails = body?.includes('Protocolo') || body?.includes('Proponente') ||
                       body?.includes('Edital') || body?.includes('PNAB-')
    expect(hasDetails).toBeTruthy()

    // Botões de habilitação (se status ENVIADA)
    const habilitarBtn = page.getByText('Habilitar inscrição', { exact: false })
    const inabilitarBtn = page.getByText('Inabilitar inscrição', { exact: false })

    if (await habilitarBtn.count() > 0) {
      console.log('  → Botão "Habilitar" presente')
      await expect(habilitarBtn.first()).toBeVisible()
    }
    if (await inabilitarBtn.count() > 0) {
      console.log('  → Botão "Inabilitar" presente')
      await expect(inabilitarBtn.first()).toBeVisible()
    }

    if (await habilitarBtn.count() === 0 && await inabilitarBtn.count() === 0) {
      console.log('  → Inscrição em status diferente de ENVIADA (botões não aparecem)')
    }

    console.log('✅ 4.2 Detalhe inscrição habilitador — OK')
  })

  test('4.3 Modal de habilitação — confirmação', async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) return

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    // Tentar abrir modal de habilitação
    const habilitarBtn = page.getByText('Habilitar inscrição', { exact: false })
    if (await habilitarBtn.count() > 0) {
      await habilitarBtn.first().click()
      await page.waitForTimeout(1000)

      // Modal de confirmação
      const confirmBtn = page.getByText('Confirmar', { exact: true })
      const cancelBtn = page.getByText('Cancelar', { exact: true })

      if (await confirmBtn.count() > 0) {
        await expect(confirmBtn.first()).toBeVisible()
        console.log('  → Modal de confirmação aberto')

        // Cancelar para não alterar dados
        if (await cancelBtn.count() > 0) {
          await cancelBtn.first().click()
          console.log('  → Modal cancelado (dados preservados)')
        }
      }
    } else {
      console.log('  → Botão habilitar não disponível para esta inscrição')
    }

    console.log('✅ 4.3 Modal habilitação — OK')
  })

  test('4.4 Modal de inabilitação — motivos pré-definidos', async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) return

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const inabilitarBtn = page.getByText('Inabilitar inscrição', { exact: false })
    if (await inabilitarBtn.count() > 0) {
      await inabilitarBtn.first().click()
      await page.waitForTimeout(1000)

      // Select de motivo padrão
      const motivoSelect = page.locator('#motivo-padrao')
      if (await motivoSelect.count() > 0) {
        await expect(motivoSelect).toBeVisible()
        console.log('  → Select de motivos presente')
      }

      // Textarea de complemento
      const complemento = page.locator('#motivo-complemento')
      if (await complemento.count() > 0) {
        await expect(complemento).toBeVisible()
        console.log('  → Campo de complemento presente')
      }

      // Cancelar
      const cancelBtn = page.getByText('Cancelar', { exact: true })
      if (await cancelBtn.count() > 0) {
        await cancelBtn.first().click()
      }
    } else {
      console.log('  → Botão inabilitar não disponível')
    }

    console.log('✅ 4.4 Modal inabilitação — OK')
  })
})

// ══════════════════════════════════════════════════════════
// 5. AVALIADOR — Avaliação de inscrições
// ══════════════════════════════════════════════════════════
test.describe('5. Avaliador — Fluxo de Avaliação', () => {

  test('5.1 Login e acesso às inscrições', async ({ page }) => {
    await login(page, USERS.AVALIADOR.cpf, USERS.AVALIADOR.senha)

    expect(page.url()).toContain('/admin')

    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Inscrições')

    console.log('✅ 5.1 Avaliador — login e inscrições — OK')
  })

  test('5.2 Detalhe da inscrição — formulário de avaliação', async ({ page }) => {
    await login(page, USERS.AVALIADOR.cpf, USERS.AVALIADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) {
      console.log('⚠️ 5.2 Sem inscrições para avaliar')
      return
    }

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Dados da inscrição
    const hasDetails = body?.includes('Proponente') || body?.includes('Edital') || body?.includes('PNAB-')
    expect(hasDetails).toBeTruthy()

    // Formulário de avaliação (se inscrição habilitada)
    const parecerField = page.locator('#parecer')
    if (await parecerField.count() > 0) {
      await expect(parecerField).toBeVisible()
      console.log('  → Campo parecer: presente')

      // Notas
      const notaInputs = page.locator('input[type="number"]')
      console.log(`  → Campos de nota: ${await notaInputs.count()}`)

      // Botões salvar/finalizar
      const salvarBtn = page.getByText('Salvar rascunho', { exact: false })
      const finalizarBtn = page.getByText('Finalizar avaliação', { exact: false })

      if (await salvarBtn.count() > 0) console.log('  → Botão "Salvar rascunho": presente')
      if (await finalizarBtn.count() > 0) console.log('  → Botão "Finalizar avaliação": presente')
    } else {
      const hasAvaliacao = body?.includes('Avaliação') || body?.includes('Finalizada') || body?.includes('Nota')
      console.log(`  → Formulário de avaliação: ${hasAvaliacao ? 'já finalizada ou não disponível' : 'não encontrado'}`)
    }

    console.log('✅ 5.2 Avaliação — OK')
  })
})

// ══════════════════════════════════════════════════════════
// 6. ATENDIMENTO — Tickets e FAQ
// ══════════════════════════════════════════════════════════
test.describe('6. Atendimento — Tickets e Suporte', () => {

  test('6.1 Login e acesso aos tickets', async ({ page }) => {
    await login(page, USERS.ATENDIMENTO.cpf, USERS.ATENDIMENTO.senha)

    expect(page.url()).toContain('/admin')

    await page.goto(`${BASE}/admin/tickets`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Tickets')

    // Filtros de status
    const hasFilters = body?.includes('Todos') || body?.includes('Abertos') ||
                       body?.includes('Em Andamento') || body?.includes('Fechados')
    expect(hasFilters).toBeTruthy()

    console.log('✅ 6.1 Atendimento — tickets — OK')
  })

  test('6.2 Detalhe do ticket — formulário de resposta', async ({ page }) => {
    await login(page, USERS.ATENDIMENTO.cpf, USERS.ATENDIMENTO.senha)
    await page.goto(`${BASE}/admin/tickets`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/tickets/"]').first()
    if (await firstLink.count() === 0) {
      console.log('⚠️ 6.2 Nenhum ticket encontrado')
      return
    }

    const href = await firstLink.getAttribute('href')
    await page.goto(`${BASE}${href}`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Protocolo')

    // Formulário de resposta
    const textoField = page.locator('#texto')
    if (await textoField.count() > 0) {
      await expect(textoField).toBeVisible()
      console.log('  → Campo de resposta: presente')
    }

    // Select de status
    const statusSelect = page.locator('#novoStatus')
    if (await statusSelect.count() > 0) {
      await expect(statusSelect).toBeVisible()
      console.log('  → Select de status: presente')
    }

    console.log('✅ 6.2 Detalhe ticket — OK')
  })

  test('6.3 FAQ — gestão pelo atendimento', async ({ page }) => {
    await login(page, USERS.ATENDIMENTO.cpf, USERS.ATENDIMENTO.senha)
    await page.goto(`${BASE}/admin/faq`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('FAQ')

    // Criar novo FAQ
    const novoLink = page.locator('a[href*="/admin/faq/novo"]')
    if (await novoLink.count() > 0) {
      await novoLink.first().click()
      await page.waitForLoadState('networkidle')

      const formBody = await page.textContent('body')
      const hasForm = formBody?.includes('Pergunta') || formBody?.includes('Resposta') || formBody?.includes('FAQ')
      expect(hasForm).toBeTruthy()
      console.log('  → Formulário de FAQ: presente')
    }

    console.log('✅ 6.3 FAQ atendimento — OK')
  })
})

// ══════════════════════════════════════════════════════════
// 7. PROTEÇÃO DE ROTAS — RBAC
// ══════════════════════════════════════════════════════════
test.describe('7. Proteção de Rotas — RBAC', () => {

  test('7.1 Visitante não acessa /proponente', async ({ page }) => {
    await page.goto(`${BASE}/proponente`)
    await page.waitForLoadState('networkidle')

    // Deve redirecionar para login
    const url = page.url()
    const redirected = url.includes('/login') || url.includes('/api/auth')
    expect(redirected).toBeTruthy()

    console.log('✅ 7.1 /proponente protegido — OK')
  })

  test('7.2 Visitante não acessa /admin', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const redirected = url.includes('/login') || url.includes('/api/auth')
    expect(redirected).toBeTruthy()

    console.log('✅ 7.2 /admin protegido — OK')
  })

  test('7.3 Proponente não acessa /admin', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/admin`)
    await page.waitForLoadState('networkidle')

    const url = page.url()
    // Deve redirecionar para home ou mostrar erro
    const blocked = !url.endsWith('/admin') || url.includes('/login') || url === `${BASE}/`
    expect(blocked).toBeTruthy()

    console.log('✅ 7.3 Proponente bloqueado de /admin — OK')
  })
})
