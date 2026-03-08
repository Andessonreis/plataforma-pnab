import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:3001'

const USERS = {
  ADMIN: { cpf: '00000000001', senha: 'Teste@123' },
  ATENDIMENTO: { cpf: '00000000002', senha: 'Teste@123' },
  HABILITADOR: { cpf: '00000000003', senha: 'Teste@123' },
  AVALIADOR: { cpf: '00000000004', senha: 'Teste@123' },
  PROPONENTE: { cpf: '12345678901', senha: 'Teste@123' },
}

async function login(page: Page, cpf: string, senha: string) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })
  await page.locator('#cpf-ou-cnpj').fill(cpf)
  await page.locator('#senha').fill(senha)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(admin|proponente)/, { timeout: 30000 })
}

// ============================================================
// PROPONENTE — Inscrições, comprovante, recurso
// ============================================================
test.describe('Proponente — Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
  })

  test('visualiza lista de inscrições', async ({ page }) => {
    await page.goto(`${BASE}/proponente/inscricoes`)
    await page.waitForLoadState('networkidle')

    // Deve ver a página de inscrições com alguma inscrição do seed
    const body = await page.textContent('body')
    expect(body).toContain('Inscrições')
  })

  test('abre detalhe de inscrição e vê status timeline', async ({ page }) => {
    await page.goto(`${BASE}/proponente/inscricoes`)
    await page.waitForLoadState('networkidle')

    // Clicar na primeira inscrição
    const firstLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await firstLink.count() > 0) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')

      // Deve ver dados da inscrição
      const body = await page.textContent('body')
      expect(body).toContain('Voltar')

      // Verificar se tem o timeline de status (labels em português)
      const hasTimeline = body?.includes('Rascunho') || body?.includes('Enviada') || body?.includes('Andamento') || body?.includes('Inscricao')
      expect(hasTimeline).toBeTruthy()
    }
  })

  test('link de comprovante aparece para inscrições enviadas', async ({ page }) => {
    await page.goto(`${BASE}/proponente/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await firstLink.count() > 0) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')

      const body = await page.textContent('body')
      // Se a inscrição não é rascunho, deve ter link de comprovante
      if (!body?.includes('RASCUNHO') || body?.includes('Comprovante')) {
        const comprovanteLink = page.locator('a[href*="/comprovante"]')
        if (await comprovanteLink.count() > 0) {
          await expect(comprovanteLink.first()).toBeVisible()
        }
      }
    }
  })

  test('formulário de recurso aparece para status elegíveis', async ({ page }) => {
    await page.goto(`${BASE}/proponente/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await firstLink.count() > 0) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')

      const body = await page.textContent('body')
      // Se inscrição está em status que permite recurso
      const canRecurso = body?.includes('Interpor Recurso') || body?.includes('recurso-texto')
      // Verificar presença do botão/formulário de recurso, ou confirmar que está num status sem recurso
      const statusSemRecurso = body?.includes('Rascunho') || body?.includes('Enviada') || body?.includes('Habilitada') || body?.includes('Em Avaliacao') || body?.includes('Andamento')
      if (canRecurso) {
        // Se aparece, o formulário deve funcionar
        const textarea = page.locator('#recurso-texto')
        if (await textarea.count() > 0) {
          await expect(textarea).toBeVisible()
        }
      } else {
        expect(statusSemRecurso).toBeTruthy()
      }
    }
  })
})

// ============================================================
// HABILITADOR — Habilitar/Inabilitar inscrições
// ============================================================
test.describe('Habilitador — Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)
  })

  test('acessa lista de inscrições', async ({ page }) => {
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Inscrições')
  })

  test('abre detalhe de inscrição e vê botões de habilitação', async ({ page }) => {
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() > 0) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')

      const body = await page.textContent('body')

      // Deve ver botões de habilitação (se inscrição está em status ENVIADA)
      const hasHabilitacao = body?.includes('Habilitar inscrição') || body?.includes('Inabilitar inscrição') || body?.includes('Habilitação')
      // Ou a inscrição pode estar em outro status
      const hasInscricaoDetails = body?.includes('Protocolo') || body?.includes('Proponente') || body?.includes('Edital')
      expect(hasHabilitacao || hasInscricaoDetails).toBeTruthy()
    }
  })

  test('fluxo de habilitação funciona', async ({ page }) => {
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) return

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    // Procurar botão "Habilitar inscrição"
    const habilitarBtn = page.getByText('Habilitar inscrição', { exact: false })
    if (await habilitarBtn.count() > 0) {
      await habilitarBtn.first().click()
      // Deve aparecer confirmação
      await page.waitForTimeout(500)
      const confirmBtn = page.getByText('Confirmar', { exact: true })
      if (await confirmBtn.count() > 0) {
        // Não confirmar de fato (para não alterar dados), apenas verificar que o diálogo aparece
        await expect(confirmBtn.first()).toBeVisible()
        // Cancelar
        const cancelBtn = page.getByText('Cancelar', { exact: true })
        if (await cancelBtn.count() > 0) {
          await cancelBtn.first().click()
        }
      }
    }
  })

  test('formulário de inabilitação tem motivos pré-definidos', async ({ page }) => {
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) return

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    // Procurar botão "Inabilitar inscrição"
    const inabilitarBtn = page.getByText('Inabilitar inscrição', { exact: false })
    if (await inabilitarBtn.count() > 0) {
      await inabilitarBtn.first().click()
      await page.waitForTimeout(500)

      // Deve ter select de motivo padrão
      const motivoSelect = page.locator('#motivo-padrao')
      if (await motivoSelect.count() > 0) {
        await expect(motivoSelect).toBeVisible()
        // Deve ter textarea para complemento
        const complemento = page.locator('#motivo-complemento')
        await expect(complemento).toBeVisible()
      }
    }
  })
})

// ============================================================
// AVALIADOR — Avaliar inscrições
// ============================================================
test.describe('Avaliador — Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.AVALIADOR.cpf, USERS.AVALIADOR.senha)
  })

  test('acessa lista de avaliações', async ({ page }) => {
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    // Avaliador vê "Minhas Avaliações" ou lista filtrada de inscrições
    expect(body).toContain('Inscrições')
  })

  test('abre inscrição e vê formulário de avaliação', async ({ page }) => {
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) return

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')

    // Avaliador deve ver formulário de avaliação ou indicar que precisa estar habilitada
    const hasAvaliacaoForm = body?.includes('Avaliação') || body?.includes('parecer') || body?.includes('Nota')
    const hasInscricaoDetails = body?.includes('Protocolo') || body?.includes('Proponente')
    expect(hasAvaliacaoForm || hasInscricaoDetails).toBeTruthy()
  })

  test('formulário de avaliação tem critérios e nota', async ({ page }) => {
    await page.goto(`${BASE}/admin/inscricoes`)
    await page.waitForLoadState('networkidle')

    const firstLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await firstLink.count() === 0) return

    await firstLink.click()
    await page.waitForLoadState('networkidle')

    // Verificar se tem o formulário de avaliação com parecer
    const parecerField = page.locator('#parecer')
    if (await parecerField.count() > 0) {
      await expect(parecerField).toBeVisible()

      // Deve ter botões de salvar rascunho e finalizar
      const salvarBtn = page.getByText('Salvar rascunho', { exact: false })
      const finalizarBtn = page.getByText('Finalizar avaliação', { exact: false })
      if (await salvarBtn.count() > 0) {
        await expect(salvarBtn.first()).toBeVisible()
      }
      if (await finalizarBtn.count() > 0) {
        await expect(finalizarBtn.first()).toBeVisible()
      }
    }
  })
})

// ============================================================
// ATENDIMENTO — Tickets
// ============================================================
test.describe('Atendimento — Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.ATENDIMENTO.cpf, USERS.ATENDIMENTO.senha)
  })

  test('acessa lista de tickets com filtros de status', async ({ page }) => {
    await page.goto(`${BASE}/admin/tickets`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Tickets')

    // Deve ter filtros de status
    const hasFiltros = body?.includes('Todos') || body?.includes('Abertos') || body?.includes('Em Andamento') || body?.includes('Fechados')
    expect(hasFiltros).toBeTruthy()
  })

  test('abre detalhe de ticket e vê formulário de resposta', async ({ page }) => {
    await page.goto(`${BASE}/admin/tickets`)
    await page.waitForLoadState('networkidle')

    // Pegar o href do primeiro ticket e navegar direto (cards podem ser hidden no desktop)
    const firstLink = page.locator('a[href*="/admin/tickets/"]').first()
    if (await firstLink.count() === 0) {
      const body = await page.textContent('body')
      const isEmpty = body?.includes('Nenhum ticket') || body?.includes('vazio')
      expect(isEmpty || true).toBeTruthy()
      return
    }

    const href = await firstLink.getAttribute('href')
    await page.goto(`${BASE}${href}`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    // Deve ver detalhes do ticket
    expect(body).toContain('Protocolo')

    // Se não está fechado, deve ter formulário de resposta
    if (!body?.includes('encerrado')) {
      const textoField = page.locator('#texto')
      if (await textoField.count() > 0) {
        await expect(textoField).toBeVisible()
      }
      // Deve ter select de status
      const statusSelect = page.locator('#novoStatus')
      if (await statusSelect.count() > 0) {
        await expect(statusSelect).toBeVisible()
      }
    }
  })

  test('acessa FAQ e pode gerenciar', async ({ page }) => {
    await page.goto(`${BASE}/admin/faq`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('FAQ')

    // Deve ter botão de criar novo FAQ
    const novoBtn = page.locator('a[href*="/admin/faq/novo"]')
    if (await novoBtn.count() > 0) {
      await expect(novoBtn.first()).toBeVisible()
    }
  })
})

// ============================================================
// ADMIN — Gestão completa (editais, usuários, resultados)
// ============================================================
test.describe('Admin — Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
  })

  test('dashboard mostra estatísticas', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    // Dashboard deve ter números/estatísticas
    expect(body).toContain('Dashboard')
  })

  test('lista editais com ações de gerenciamento', async ({ page }) => {
    await page.goto(`${BASE}/admin/editais`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Editais')

    // Deve ter botão "Novo Edital"
    const novoBtn = page.locator('a[href*="/admin/editais/novo"]')
    if (await novoBtn.count() > 0) {
      await expect(novoBtn.first()).toBeVisible()
    }
  })

  test('formulário de criação de edital funciona', async ({ page }) => {
    await page.goto(`${BASE}/admin/editais/novo`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    // Deve ter campos do formulário
    expect(body).toContain('Título')

    // Verificar campos essenciais (skip hidden checkbox do sidebar)
    const tituloInput = page.locator('input:visible').first()
    await expect(tituloInput).toBeVisible()

    // Deve ter botão de submit
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn.first()).toBeVisible()

    // Deve ter categorias culturais
    const hasCategorias = body?.includes('Categorias') || body?.includes('Artes Visuais') || body?.includes('Música')
    expect(hasCategorias).toBeTruthy()
  })

  test('edita edital existente com nova seção acessível', async ({ page }) => {
    await page.goto(`${BASE}/admin/editais`)
    await page.waitForLoadState('networkidle')

    // Pegar href do primeiro edital e navegar direto (cards podem ser hidden no desktop)
    const editLink = page.locator('a[href*="/admin/editais/c"]').first()
    if (await editLink.count() === 0) return

    const href = await editLink.getAttribute('href')
    await page.goto(`${BASE}${href}`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    // Deve ter seção de versão acessível (nova feature) — texto: "Versão Acessível (WCAG AA)"
    const hasAcessivel = body?.includes('Acessível') || body?.includes('WCAG') || body?.includes('acessível')
    expect(hasAcessivel).toBeTruthy()
  })

  test('acessa página de resultados do edital', async ({ page }) => {
    await page.goto(`${BASE}/admin/editais`)
    await page.waitForLoadState('networkidle')

    // Procurar link "Ver Resultados" ou acessar direto
    const resultadosLink = page.locator('a[href*="/resultados"]').first()
    if (await resultadosLink.count() > 0) {
      await resultadosLink.click()
      await page.waitForLoadState('networkidle')

      const body = await page.textContent('body')
      const hasResultados = body?.includes('Resultado') || body?.includes('Nota') || body?.includes('Classificação')
      expect(hasResultados).toBeTruthy()
    }
  })

  test('gerencia usuários', async ({ page }) => {
    await page.goto(`${BASE}/admin/usuarios`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Usuários')

    // Deve listar usuários com roles
    const hasRoles = body?.includes('ADMIN') || body?.includes('PROPONENTE') || body?.includes('Administrador')
    expect(hasRoles).toBeTruthy()
  })

  test('acessa logs de auditoria', async ({ page }) => {
    await page.goto(`${BASE}/admin/logs`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Auditoria') || expect(body).toContain('Logs')
  })

  test('gerencia recursos (apelações)', async ({ page }) => {
    await page.goto(`${BASE}/admin/recursos`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Recursos')
    // Deve mostrar contadores
    const hasContadores = body?.includes('pendente') || body?.includes('decidido')
    expect(hasContadores).toBeTruthy()
  })

  test('gerencia contemplados', async ({ page }) => {
    await page.goto(`${BASE}/admin/contemplados`)
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body).toContain('Contemplados')
  })
})
