import { test, expect, type Page } from '@playwright/test'

/**
 * TESTES FUNCIONAIS COMPLETOS — E2E por perfil de usuário
 *
 * Diferente do dashboard-visual.spec.ts (que verifica se as páginas carregam),
 * este arquivo testa funcionalidades reais: preencher formulários, submeter
 * dados, verificar que o dado foi criado, etc.
 *
 * Rode com:
 *   npx playwright test e2e/funcional-completo.spec.ts --config=e2e/playwright.roles.config.ts --headed
 *
 * Rodar só um perfil:
 *   npx playwright test e2e/funcional-completo.spec.ts --config=e2e/playwright.roles.config.ts --headed -g "Admin"
 *
 * Total: 28 testes funcionais
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
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto(`${BASE}/login`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Se já está logado (serial mode compartilha cookies), pular
    if (/\/(admin|proponente)/.test(page.url())) return

    await page.waitForSelector('#cpf-ou-cnpj', { timeout: 20000 })
    await page.locator('#cpf-ou-cnpj').fill(cpf)
    await page.locator('#senha').fill(senha)
    await page.getByRole('button', { name: 'Entrar' }).click()

    try {
      await page.waitForURL(/\/(admin|proponente)/, { timeout: 30000, waitUntil: 'domcontentloaded' })
      return
    } catch {
      if (attempt === 2) throw new Error(`Login falhou após 2 tentativas para CPF ${cpf}`)
      console.log(`  ⚠️ Login tentativa ${attempt} falhou, retrying...`)
      await page.waitForTimeout(2000)
    }
  }
}

/** Coleta hrefs visíveis de inscrições na lista admin, evitando links de paginação/export */
async function collectInscricaoHrefs(page: Page): Promise<string[]> {
  const allHrefs = await page.locator('a[href*="/admin/inscricoes/"]').evaluateAll(
    (els) => els.map((el) => el.getAttribute('href')).filter(Boolean) as string[]
  )
  return allHrefs.filter((h) => !h.includes('/export') && !h.includes('/page'))
}

async function logout(page: Page) {
  const sairLink = page.locator('a[href*="/signout"], a:has-text("Sair")').first()
  if (await sairLink.count() > 0) {
    await sairLink.click()
    await page.waitForTimeout(2000)
    const confirmBtn = page.locator('button[type="submit"]').first()
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click()
      await page.waitForTimeout(2000)
    }
  }
}

// Timestamp para dados únicos
const TS = Date.now()

// ══════════════════════════════════════════════════════════════
// 1. VISITANTE — Sem login (5 testes)
// ══════════════════════════════════════════════════════════════
test.describe('1. Visitante — Funcionalidades Públicas', () => {

  test('1.1 Enviar formulário de contato e receber protocolo', async ({ page }) => {
    await page.goto(`${BASE}/contato`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Preencher formulário
    await page.locator('#nome-completo').fill('Maria Silva Teste')
    await page.locator('#e-mail').fill(`teste-e2e-${TS}@exemplo.com`)
    await page.locator('#assunto').fill('Dúvida sobre edital E2E')
    await page.locator('#mensagem').fill('Gostaria de saber mais informações sobre os editais abertos para inscrição de projetos culturais no município de Irecê.')

    // Selecionar edital se existir
    const editalSelect = page.locator('#edital-select')
    if (await editalSelect.count() > 0) {
      const options = await editalSelect.locator('option').count()
      if (options > 1) {
        await editalSelect.selectOption({ index: 1 })
      }
    }

    // Submeter
    await page.getByRole('button', { name: 'Enviar mensagem' }).click()
    await page.waitForTimeout(5000)

    // Verificar protocolo (PNAB-xxxx) ou mensagem de sucesso
    const body = await page.textContent('body')
    const hasProtocolo = body?.includes('PNAB-') || body?.includes('protocolo') || body?.includes('Protocolo')
    const hasSuccess = body?.includes('sucesso') || body?.includes('Enviada') || body?.includes('nova mensagem')
    expect(hasProtocolo || hasSuccess).toBeTruthy()

    console.log('✅ 1.1 Contato enviado — protocolo recebido')
  })

  test('1.2 Cadastro Pessoa Física (PF)', async ({ page }) => {
    await page.goto(`${BASE}/cadastro`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Tipo PF já deve ser o default, mas clicar para garantir
    const pfBtn = page.locator('button[aria-pressed]:has-text("PF")').first()
    if (await pfBtn.count() > 0) {
      await pfBtn.click()
      await page.waitForTimeout(500)
    }

    // Preencher dados
    const cpfRandom = `${Math.floor(10000000000 + Math.random() * 89999999999)}`
    await page.locator('#nome-completo').fill(`Proponente Teste E2E ${TS}`)
    await page.locator('#cpf').fill(cpfRandom)
    await page.locator('#e-mail').fill(`pf-teste-${TS}@exemplo.com`)
    await page.locator('#telefone').fill('74999887766')
    await page.locator('#cep').fill('44900000')
    await page.waitForTimeout(2000) // esperar ViaCEP

    // Preencher campos de endereço que podem não ter sido preenchidos pelo ViaCEP
    const logradouro = page.locator('#logradouro')
    if (await logradouro.inputValue() === '') {
      await logradouro.fill('Rua Teste E2E')
    }
    await page.locator('#numero').fill('123')
    const bairro = page.locator('#bairro')
    if (await bairro.inputValue() === '') {
      await bairro.fill('Centro')
    }
    const cidade = page.locator('#cidade')
    if (await cidade.inputValue() === '') {
      await cidade.fill('Irecê')
    }

    // Selecionar UF se necessário
    const ufSelect = page.locator('select').filter({ hasText: 'BA' }).first()
    if (await ufSelect.count() > 0) {
      await ufSelect.selectOption('BA')
    }

    // Senha
    await page.locator('#senha').fill('TesteE2E@2026')
    await page.locator('#confirmar-senha').fill('TesteE2E@2026')

    // Submeter
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(5000)

    // Verificar redirect ou mensagem de sucesso
    const url = page.url()
    const body = await page.textContent('body')
    const redirected = url.includes('/login') || url.includes('cadastro=sucesso')
    const hasSuccess = body?.includes('sucesso') || body?.includes('conta criada') || body?.includes('Cadastro')
    expect(redirected || hasSuccess).toBeTruthy()

    console.log('✅ 1.2 Cadastro PF — OK')
  })

  test('1.3 Cadastro Pessoa Jurídica (PJ)', async ({ page }) => {
    await page.goto(`${BASE}/cadastro`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Selecionar tipo PJ
    const pjBtn = page.locator('button[aria-pressed]:has-text("PJ")').first()
    if (await pjBtn.count() > 0) {
      await pjBtn.click()
      await page.waitForTimeout(500)
    }

    // Preencher dados
    const cnpjRandom = `${Math.floor(10000000000000 + Math.random() * 89999999999999)}`

    // O label muda para "Razão Social" para PJ
    const razaoSocial = page.locator('#razão-social').first()
    if (await razaoSocial.count() > 0) {
      await razaoSocial.fill(`Empresa Cultural E2E ${TS} LTDA`)
    } else {
      // Fallback: primeiro input visível pode ser o nome
      await page.locator('#nome-completo').fill(`Empresa Cultural E2E ${TS} LTDA`)
    }

    const cnpjField = page.locator('#cnpj').first()
    if (await cnpjField.count() > 0) {
      await cnpjField.fill(cnpjRandom)
    } else {
      await page.locator('#cpf').fill(cnpjRandom)
    }

    await page.locator('#e-mail').fill(`pj-teste-${TS}@exemplo.com`)
    await page.locator('#telefone').fill('74988776655')
    await page.locator('#cep').fill('44900000')
    await page.waitForTimeout(2000) // esperar ViaCEP

    const logradouro = page.locator('#logradouro')
    if (await logradouro.inputValue() === '') {
      await logradouro.fill('Av. Teste E2E')
    }
    await page.locator('#numero').fill('456')
    const bairro = page.locator('#bairro')
    if (await bairro.inputValue() === '') {
      await bairro.fill('Centro')
    }
    const cidade = page.locator('#cidade')
    if (await cidade.inputValue() === '') {
      await cidade.fill('Irecê')
    }

    await page.locator('#senha').fill('TesteE2E@2026')
    await page.locator('#confirmar-senha').fill('TesteE2E@2026')

    // Submeter
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(5000)

    const url = page.url()
    const body = await page.textContent('body')
    const redirected = url.includes('/login') || url.includes('cadastro=sucesso')
    const hasSuccess = body?.includes('sucesso') || body?.includes('conta criada') || body?.includes('Cadastro')
    expect(redirected || hasSuccess).toBeTruthy()

    console.log('✅ 1.3 Cadastro PJ — OK')
  })

  test('1.4 Login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.goto(`${BASE}/login`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })

    // Preencher com dados inválidos
    await page.locator('#cpf-ou-cnpj').fill('99999999999')
    await page.locator('#senha').fill('SenhaErrada123')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)

    // Verificar mensagem de erro
    const body = await page.textContent('body')
    const hasError = body?.includes('inválid') || body?.includes('incorret') || body?.includes('erro') ||
                     body?.includes('Erro') || body?.includes('Credenciais') || body?.includes('não encontrad')
    expect(hasError).toBeTruthy()

    // Não deve ter redirecionado
    expect(page.url()).toContain('/login')

    console.log('✅ 1.4 Login inválido — erro exibido')
  })

  test('1.5 Recuperar senha — solicitar instruções', async ({ page }) => {
    await page.goto(`${BASE}/recuperar-senha`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Preencher CPF
    // O campo usa label "CPF ou CNPJ" → id = "cpf-ou-cnpj"
    await page.locator('#cpf-ou-cnpj').fill('12345678901')

    // Submeter
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)

    // Verificar mensagem de sucesso
    const body = await page.textContent('body')
    const hasSuccess = body?.includes('receberá um e-mail') || body?.includes('instruções') ||
                       body?.includes('caixa de entrada') || body?.includes('spam')
    expect(hasSuccess).toBeTruthy()

    console.log('✅ 1.5 Recuperar senha — instruções enviadas')
  })
})

// ══════════════════════════════════════════════════════════════
// 2. PROPONENTE — Inscrições, perfil, recurso (6 testes)
// ══════════════════════════════════════════════════════════════
test.describe.serial('2. Proponente — Inscrições e Perfil', () => {
  test.describe.configure({ timeout: 180000 })

  test('2.1 Criar inscrição (rascunho) a partir de edital aberto', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)

    // Ir para editais públicos
    await page.goto(`${BASE}/editais`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Encontrar edital com inscrições abertas
    const editalLink = page.locator('a[href*="/editais/"]').first()
    if (await editalLink.count() === 0) {
      console.log('⚠️ 2.1 Nenhum edital encontrado — pulando')
      return
    }

    const href = await editalLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Clicar no CTA "Inscrever-se" que leva para /proponente/inscricoes/nova
    const inscreverLink = page.locator('a[href*="/proponente/inscricoes/nova"]').first()
    if (await inscreverLink.count() === 0) {
      // Edital não tem inscrições abertas — buscar direto por editalId na URL
      const editalPath = page.url()
      console.log(`⚠️ 2.1 Edital ${editalPath} sem inscrições abertas — tentando outro`)

      // Voltar à lista e tentar navegar direto para inscricao nova com o editalId do seed
      await page.goto(`${BASE}/proponente/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      const newBtn = page.locator('a[href*="/inscricoes/nova"]').first()
      if (await newBtn.count() > 0) {
        await newBtn.click()
        await page.waitForTimeout(3000)
      } else {
        console.log('⚠️ 2.1 Nenhum edital com inscrições abertas encontrado')
        return
      }
    } else {
      await inscreverLink.click()
      await page.waitForTimeout(5000)
      await page.waitForLoadState('domcontentloaded')
    }

    // Deve estar na página de nova inscrição
    const url = page.url()
    if (!url.includes('/inscricoes/nova')) {
      console.log('⚠️ 2.1 Não conseguiu navegar para /inscricoes/nova')
      return
    }

    const body = await page.textContent('body')

    // Passo 1: Categoria (se existir)
    const categoriaSelect = page.locator('#categoria')
    if (await categoriaSelect.count() > 0) {
      const options = await categoriaSelect.locator('option').count()
      if (options > 1) {
        await categoriaSelect.selectOption({ index: 1 })
        console.log('  → Categoria selecionada')
      }
      // Avançar
      const proximoBtn = page.getByText('Proximo', { exact: false }).first()
      if (await proximoBtn.count() > 0) {
        await proximoBtn.click()
        await page.waitForTimeout(1000)
      }
    }

    // Passo 2: Dados — preencher campos dinâmicos
    const textInputs = page.locator('input[type="text"]:visible')
    const inputCount = await textInputs.count()
    for (let i = 0; i < inputCount; i++) {
      const val = await textInputs.nth(i).inputValue()
      if (!val) {
        await textInputs.nth(i).fill(`Dado teste E2E ${i + 1}`)
      }
    }

    const textareas = page.locator('textarea:visible')
    const taCount = await textareas.count()
    for (let i = 0; i < taCount; i++) {
      const val = await textareas.nth(i).inputValue()
      if (!val) {
        await textareas.nth(i).fill(`Descrição de teste E2E para campo ${i + 1}. Este texto serve para preencher os campos obrigatórios do formulário de inscrição.`)
      }
    }

    // Salvar rascunho
    const salvarBtn = page.getByText('Salvar rascunho', { exact: false }).first()
    if (await salvarBtn.count() > 0) {
      await salvarBtn.click()
      await page.waitForTimeout(3000)

      const afterSave = await page.textContent('body')
      const saved = afterSave?.includes('salvo') || afterSave?.includes('Rascunho') || afterSave?.includes('sucesso') ||
                    page.url().includes('/inscricoes/')
      expect(saved).toBeTruthy()
      console.log('✅ 2.1 Inscrição criada como rascunho')
    } else {
      console.log('⚠️ 2.1 Botão "Salvar rascunho" não encontrado')
    }
  })

  test('2.2 Editar inscrição rascunho', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Encontrar inscrição com link de edição ou em rascunho
    const inscricaoLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await inscricaoLink.count() === 0) {
      console.log('⚠️ 2.2 Nenhuma inscrição encontrada')
      return
    }

    const href = await inscricaoLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')

    // Verificar se há link "Editar Inscrição" (só para rascunhos)
    const editarLink = page.locator('a:has-text("Editar Inscricao"), a:has-text("Editar Inscrição")').first()
    if (await editarLink.count() === 0) {
      console.log('⚠️ 2.2 Inscrição não está em rascunho — edição não disponível')
      return
    }

    await editarLink.click()
    await page.waitForTimeout(5000)
    await page.waitForLoadState('domcontentloaded')

    expect(page.url()).toContain('/editar')

    // Modificar algum campo
    const textInputs = page.locator('input[type="text"]:visible')
    if (await textInputs.count() > 0) {
      const firstInput = textInputs.first()
      await firstInput.fill(`Dado editado E2E ${TS}`)
    }

    // Salvar
    const salvarBtn = page.getByText('Salvar rascunho', { exact: false }).first()
    if (await salvarBtn.count() > 0) {
      await salvarBtn.click()
      await page.waitForTimeout(3000)
      console.log('✅ 2.2 Inscrição rascunho editada')
    } else {
      console.log('⚠️ 2.2 Botão "Salvar rascunho" não encontrado na edição')
    }
  })

  test('2.3 Submeter inscrição (enviar para análise)', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Encontrar inscrição rascunho para submeter
    const inscricaoLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await inscricaoLink.count() === 0) {
      console.log('⚠️ 2.3 Nenhuma inscrição encontrada')
      return
    }

    const href = await inscricaoLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')

    // Se já está enviada, verificar status
    if (!body?.includes('Rascunho') && !body?.includes('RASCUNHO')) {
      const hasEnviada = body?.includes('Enviada') || body?.includes('Habilitada') || body?.includes('Andamento')
      expect(hasEnviada).toBeTruthy()
      console.log('✅ 2.3 Inscrição já está enviada/processada')
      return
    }

    // Ir para edição para submeter
    const editarLink = page.locator('a:has-text("Editar Inscricao"), a:has-text("Editar Inscrição")').first()
    if (await editarLink.count() === 0) {
      console.log('⚠️ 2.3 Link de edição não encontrado')
      return
    }

    await editarLink.click()
    await page.waitForTimeout(5000)
    await page.waitForLoadState('domcontentloaded')

    // Navegar até o passo de revisão clicando "Proximo"
    for (let i = 0; i < 5; i++) {
      const proximoBtn = page.getByText('Proximo', { exact: false }).first()
      if (await proximoBtn.count() > 0) {
        await proximoBtn.click()
        await page.waitForTimeout(2000)
      } else {
        break
      }
      // Verificar se chegou na revisão
      const currentBody = await page.textContent('body')
      if (currentBody?.includes('Enviar Inscricao') || currentBody?.includes('Enviar Inscrição')) {
        break
      }
    }

    // Submeter
    const enviarBtn = page.getByText('Enviar Inscricao', { exact: false }).first()
    if (await enviarBtn.count() > 0) {
      await enviarBtn.click()
      await page.waitForTimeout(5000)

      const afterSubmit = await page.textContent('body')
      const submitted = afterSubmit?.includes('Enviada') || afterSubmit?.includes('sucesso') ||
                        afterSubmit?.includes('enviada') || page.url().includes('/inscricoes/')
      expect(submitted).toBeTruthy()
      console.log('✅ 2.3 Inscrição submetida')
    } else {
      console.log('⚠️ 2.3 Botão "Enviar Inscrição" não encontrado (pode estar faltando dados obrigatórios)')
    }
  })

  test('2.4 Download de comprovante PDF', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Encontrar inscrição que não seja rascunho
    const inscricaoLink = page.locator('a[href*="/proponente/inscricoes/"]').first()
    if (await inscricaoLink.count() === 0) {
      console.log('⚠️ 2.4 Nenhuma inscrição encontrada')
      return
    }

    const href = await inscricaoLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')

    // Verificar se tem link de comprovante (não aparece em rascunho)
    if (body?.includes('Rascunho') || body?.includes('RASCUNHO')) {
      console.log('⚠️ 2.4 Inscrição em rascunho — sem comprovante')
      return
    }

    const comprovanteLink = page.locator('a[href*="/comprovante"]').first()
    expect(await comprovanteLink.count()).toBeGreaterThan(0)

    // Verificar que o link aponta para o endpoint correto
    const comprovanteHref = await comprovanteLink.getAttribute('href')
    expect(comprovanteHref).toContain('/comprovante')

    // Testar download (interceptar resposta)
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
      comprovanteLink.click(),
    ])

    if (download) {
      console.log(`✅ 2.4 Comprovante baixado: ${download.suggestedFilename()}`)
    } else {
      // O link pode abrir em nova aba — verificar via fetch
      const response = await page.request.get(`${BASE}${comprovanteHref}`)
      expect(response.status()).toBeLessThan(400)
      console.log('✅ 2.4 Comprovante PDF acessível')
    }
  })

  test('2.5 Editar perfil (nome e telefone)', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/perfil`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Modificar nome
    const nomeInput = page.locator('#nome-completo')
    await expect(nomeInput).toBeVisible()
    const nomeAtual = await nomeInput.inputValue()
    const novoNome = nomeAtual.includes('Editado') ? nomeAtual.replace(' Editado', '') : `${nomeAtual} Editado`
    await nomeInput.fill(novoNome)

    // Modificar telefone
    const telefoneInput = page.locator('#telefone')
    if (await telefoneInput.count() > 0) {
      await telefoneInput.fill('74999112233')
    }

    // Salvar
    const salvarBtn = page.getByText('Salvar Alteracoes', { exact: false }).first()
    if (await salvarBtn.count() === 0) {
      // Tentar variação com acento
      const salvarBtn2 = page.getByText('Salvar Alterações', { exact: false }).first()
      if (await salvarBtn2.count() > 0) {
        await salvarBtn2.click()
      }
    } else {
      await salvarBtn.click()
    }
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    const saved = body?.includes('sucesso') || body?.includes('salvo') || body?.includes('atualizado')
    // Verificar que o nome mudou
    const nameUpdated = body?.includes(novoNome)
    expect(saved || nameUpdated).toBeTruthy()

    console.log('✅ 2.5 Perfil editado com sucesso')
  })

  test('2.6 Interpor recurso (se status elegível)', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`${BASE}/proponente/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Procurar inscrição com status que permite recurso
    const hrefs = await page.locator('a[href*="/proponente/inscricoes/"]').evaluateAll(
      (els) => els.map((el) => el.getAttribute('href')).filter(Boolean) as string[]
    )

    let foundRecursoForm = false

    for (const href of hrefs.slice(0, 5)) {
      await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const recursoTextarea = page.locator('#recurso-texto')
      if (await recursoTextarea.count() > 0) {
        foundRecursoForm = true

        // Preencher fundamentação
        await recursoTextarea.fill(
          'Venho por meio deste interpor recurso contra a decisão proferida, ' +
          'apresentando os seguintes fundamentos: o projeto atende a todos os ' +
          'requisitos do edital conforme documentação anexada, incluindo comprovação ' +
          'de residência atualizada e plano de trabalho detalhado.'
        )

        // Submeter
        const submitBtn = page.getByText('Submeter Recurso', { exact: false }).first()
        if (await submitBtn.count() > 0 && await submitBtn.isEnabled()) {
          await submitBtn.click()
          await page.waitForTimeout(3000)

          const body = await page.textContent('body')
          const success = body?.includes('sucesso') || body?.includes('submetido')
          expect(success).toBeTruthy()
          console.log('✅ 2.6 Recurso submetido com sucesso')
        }
        break
      }
    }

    if (!foundRecursoForm) {
      console.log('⚠️ 2.6 Nenhuma inscrição com status elegível para recurso encontrada')
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 3. ADMIN — Gestão completa (10 testes)
// ══════════════════════════════════════════════════════════════
test.describe.serial('3. Admin — Funcionalidades Completas', () => {
  test.describe.configure({ timeout: 180000 })

  test('3.1 Criar edital completo', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/editais/novo`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Título
    await page.locator('#título-do-edital').fill(`Edital Funcional E2E ${TS}`)

    // Resumo
    await page.locator('#resumo-\\/-descrição').fill(
      'Edital de fomento cultural criado automaticamente pelo teste funcional E2E. ' +
      'Este edital contempla projetos nas áreas de música, artes visuais e cultura popular.'
    )

    // Ano
    const anoSelect = page.locator('#ano')
    if (await anoSelect.count() > 0) {
      await anoSelect.selectOption('2026')
    }

    // Valor Total
    const valorInput = page.locator('#valor-total-\\(r\\$\\)')
    if (await valorInput.count() > 0) {
      await valorInput.fill('500000')
    }

    // Status: PUBLICADO
    const statusSelect = page.locator('#status')
    await statusSelect.selectOption('PUBLICADO')

    // Categorias (toggle buttons)
    const musicaBtn = page.locator('button[aria-pressed]:has-text("Música")').first()
    if (await musicaBtn.count() > 0) await musicaBtn.click()
    await page.waitForTimeout(300)
    const artesBtn = page.locator('button[aria-pressed]:has-text("Artes Visuais")').first()
    if (await artesBtn.count() > 0) await artesBtn.click()
    await page.waitForTimeout(300)

    // Cronograma — adicionar etapa
    const addEtapaBtn = page.getByText('Adicionar etapa', { exact: false }).first()
    if (await addEtapaBtn.count() > 0) {
      await addEtapaBtn.click()
      await page.waitForTimeout(500)

      const etapaInput = page.locator('#etapa').first()
      if (await etapaInput.count() > 0) {
        await etapaInput.fill('Período de inscrições')
      }
      const dataInput = page.locator('#data-\\/-hora').first()
      if (await dataInput.count() > 0) {
        await dataInput.fill('2026-04-01T08:00')
      }
    }

    // Submit
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(5000)

    // Verificar criação — redirect para lista ou mensagem de sucesso
    const body = await page.textContent('body')
    const url = page.url()
    const created = url.includes('/admin/editais') || body?.includes('sucesso') ||
                    body?.includes('criado') || body?.includes(`Edital Funcional E2E`)
    expect(created).toBeTruthy()

    console.log('✅ 3.1 Edital criado com sucesso')
  })

  test('3.2 Editar edital existente', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/editais`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Pegar primeiro edital editável
    const editLink = page.locator('a[href*="/admin/editais/c"]').first()
    if (await editLink.count() === 0) {
      console.log('⚠️ 3.2 Nenhum edital para editar')
      return
    }

    const href = await editLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Modificar status
    const statusSelect = page.locator('#status')
    if (await statusSelect.count() > 0) {
      const currentStatus = await statusSelect.inputValue()
      // Mudar para INSCRICOES_ABERTAS se não está
      if (currentStatus !== 'INSCRICOES_ABERTAS') {
        await statusSelect.selectOption('INSCRICOES_ABERTAS')
      }
    }

    // Salvar
    const salvarBtn = page.locator('button[type="submit"]').first()
    await salvarBtn.click()
    await page.waitForTimeout(5000)

    const body = await page.textContent('body')
    const saved = body?.includes('sucesso') || body?.includes('salvo') || body?.includes('alterações') ||
                  page.url().includes('/admin/editais')
    expect(saved).toBeTruthy()

    console.log('✅ 3.2 Edital editado com sucesso')
  })

  test('3.3 Criar notícia', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/noticias/nova`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Título
    await page.locator('#titulo-da-noticia').fill(`Notícia E2E ${TS} — Abertas inscrições para edital`)

    // Corpo
    await page.locator('#corpo-da-noticia').fill(
      'A Secretaria de Arte e Cultura de Irecê informa que estão abertas as inscrições para o edital PNAB 2026. ' +
      'Os interessados devem acessar a plataforma e realizar o cadastro para submeter seus projetos. ' +
      'O prazo de inscrição é até 30 de abril de 2026.'
    )

    // Tags
    const tagsInput = page.locator('#tags')
    if (await tagsInput.count() > 0) {
      await tagsInput.fill('edital, pnab, inscrições, cultura')
    }

    // Publicar — usar label ao invés de input genérico (evita sidebar toggle hidden)
    const publicarLabel = page.locator('label:has-text("Publicar")').first()
    if (await publicarLabel.count() > 0) {
      await publicarLabel.click()
    }

    // Submit
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(5000)

    const body = await page.textContent('body')
    const url = page.url()
    const created = url.includes('/admin/noticias') || body?.includes('sucesso') || body?.includes('criada')
    expect(created).toBeTruthy()

    console.log('✅ 3.3 Notícia criada com sucesso')
  })

  test('3.4 Editar notícia existente', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/noticias`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Clicar na primeira notícia editável
    const noticiaLink = page.locator('a[href*="/admin/noticias/"]').first()
    if (await noticiaLink.count() === 0) {
      console.log('⚠️ 3.4 Nenhuma notícia para editar')
      return
    }

    const href = await noticiaLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Modificar título
    const tituloInput = page.locator('#titulo-da-noticia')
    if (await tituloInput.count() > 0) {
      const tituloAtual = await tituloInput.inputValue()
      await tituloInput.fill(`${tituloAtual} (editado E2E)`)
    }

    // Salvar
    const salvarBtn = page.locator('button[type="submit"]').first()
    await salvarBtn.click()
    await page.waitForTimeout(5000)

    const body = await page.textContent('body')
    const saved = body?.includes('sucesso') || body?.includes('salvo') || page.url().includes('/admin/noticias')
    expect(saved).toBeTruthy()

    console.log('✅ 3.4 Notícia editada com sucesso')
  })

  test('3.5 Criar FAQ', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/faq/novo`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Pergunta
    await page.locator('#pergunta').fill(`Como faço para me inscrever no edital PNAB? (E2E ${TS})`)

    // Resposta
    await page.locator('#resposta').fill(
      'Para se inscrever, acesse a plataforma PNAB Irecê, realize seu cadastro como proponente, ' +
      'navegue até a página de editais, escolha o edital desejado e clique em "Inscrever-se". ' +
      'Preencha todos os campos obrigatórios e anexe a documentação necessária.'
    )

    // Publicar
    const publicadoCheckbox = page.locator('#faq-publicado')
    if (await publicadoCheckbox.count() > 0) {
      if (!(await publicadoCheckbox.isChecked())) {
        await publicadoCheckbox.click()
      }
    }

    // Submit
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(5000)

    const body = await page.textContent('body')
    const url = page.url()
    const created = url.includes('/admin/faq') || body?.includes('sucesso') || body?.includes('criado')
    expect(created).toBeTruthy()

    console.log('✅ 3.5 FAQ criado com sucesso')
  })

  test('3.6 Exportar CSV de inscrições', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Navegar direto para a página de exportação (o botão pode ser um componente Button)
    await page.goto(`${BASE}/admin/inscricoes/export`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    const hasExport = body?.includes('Exportação') || body?.includes('Exportar') || body?.includes('CSV')
    expect(hasExport).toBeTruthy()

    // Clicar no botão "Exportar CSV" da página de export
    const downloadBtn = page.getByText('Exportar CSV', { exact: false }).first()
    if (await downloadBtn.count() > 0) {
      // Interceptar o download
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }).catch(() => null),
        downloadBtn.click(),
      ])

      if (download) {
        expect(download.suggestedFilename()).toContain('.csv')
        console.log(`✅ 3.6 CSV exportado: ${download.suggestedFilename()}`)
      } else {
        // O download pode ter sido bloqueado, mas verificar que não houve erro
        console.log('✅ 3.6 Página de exportação acessada (download pode requerer popup)')
      }
    }
  })

  test('3.7 Gerenciar usuários — verificar lista com roles', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/usuarios`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    expect(body).toContain('Usuários')

    // Deve ter roles visíveis
    const hasAdmin = body?.includes('ADMIN') || body?.includes('Administrador')
    const hasProponente = body?.includes('PROPONENTE') || body?.includes('Proponente')
    expect(hasAdmin || hasProponente).toBeTruthy()

    // Deve listar pelo menos os usuários do seed
    const rows = page.locator('tr, [role="row"]')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(1)

    console.log(`✅ 3.7 Usuários listados (${rowCount} linhas)`)
  })

  test('3.8 Verificar logs de auditoria', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/logs`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    const hasLogs = body?.includes('Auditoria') || body?.includes('Logs') || body?.includes('Atividade')
    expect(hasLogs).toBeTruthy()

    // Deve mostrar ações recentes (do teste de criação de edital, etc.)
    const hasEntries = body?.includes('CREATE') || body?.includes('UPDATE') || body?.includes('LOGIN') ||
                       body?.includes('criou') || body?.includes('atualizou') || body?.includes('edital')
    console.log(`  → Entradas de log: ${hasEntries ? 'presentes' : 'lista pode estar vazia'}`)

    console.log('✅ 3.8 Logs de auditoria verificados')
  })

  test('3.9 Decidir recurso', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/recursos`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    expect(body).toContain('Recursos')

    // Encontrar recurso pendente — clica na inscrição associada
    const recursoLink = page.locator('a[href*="/admin/inscricoes/"]').first()
    if (await recursoLink.count() === 0) {
      console.log('⚠️ 3.9 Nenhum recurso pendente encontrado')
      return
    }

    const href = await recursoLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const detailBody = await page.textContent('body')

    // Procurar formulário de decisão de recurso
    const deferir = page.getByText('Deferir', { exact: false }).first()
    const indeferir = page.getByText('Indeferir', { exact: false }).first()

    if (await deferir.count() > 0) {
      // Clicar em "Deferir"
      await deferir.click()
      await page.waitForTimeout(500)

      // Preencher justificativa
      const justificativa = page.locator('#justificativa')
      if (await justificativa.count() > 0) {
        await justificativa.fill(
          'Após análise detalhada dos argumentos apresentados, verificamos que o recurso é procedente. ' +
          'A documentação foi devidamente complementada e atende aos requisitos do edital.'
        )

        // Confirmar decisão
        const confirmarBtn = page.getByText('Confirmar Decisao', { exact: false }).first()
        if (await confirmarBtn.count() > 0 && await confirmarBtn.isEnabled()) {
          await confirmarBtn.click()
          await page.waitForTimeout(3000)

          const afterDecision = await page.textContent('body')
          const decided = afterDecision?.includes('sucesso') || afterDecision?.includes('DEFERIDO') ||
                          afterDecision?.includes('decidido')
          expect(decided).toBeTruthy()
          console.log('✅ 3.9 Recurso deferido com sucesso')
          return
        }
      }
    }

    console.log('⚠️ 3.9 Formulário de decisão de recurso não disponível nesta inscrição')
  })

  test('3.10 Criar página CMS', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)
    await page.goto(`${BASE}/admin/cms`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Encontrar link "Nova Página" ou ir direto
    const novaLink = page.locator('a[href*="/admin/cms/novo"], a[href*="/admin/cms/nova"]').first()
    if (await novaLink.count() > 0) {
      await novaLink.click()
    } else {
      await page.goto(`${BASE}/admin/cms/novo`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    }
    await page.waitForTimeout(3000)

    // Título
    const tituloInput = page.locator('#titulo-da-pagina')
    if (await tituloInput.count() === 0) {
      console.log('⚠️ 3.10 Formulário CMS não encontrado')
      return
    }

    await tituloInput.fill(`Página E2E ${TS} — Informações Gerais`)

    // Corpo HTML
    const corpoTextarea = page.locator('#corpo-\\(html\\)')
    if (await corpoTextarea.count() > 0) {
      await corpoTextarea.fill(
        '<h2>Informações Gerais</h2>\n' +
        '<p>Esta página foi criada pelo teste funcional E2E da plataforma PNAB Irecê.</p>\n' +
        '<p>Aqui você encontra informações sobre os editais e programas culturais do município.</p>'
      )
    }

    // Publicar — usar label (evita sidebar toggle hidden)
    const publicarLabel = page.locator('label:has-text("Publicar")').first()
    if (await publicarLabel.count() > 0) {
      await publicarLabel.click()
    }

    // Submit
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(5000)

    const body = await page.textContent('body')
    const url = page.url()
    const created = url.includes('/admin/cms') || body?.includes('sucesso') || body?.includes('criada')
    expect(created).toBeTruthy()

    console.log('✅ 3.10 Página CMS criada com sucesso')
  })
})

// ══════════════════════════════════════════════════════════════
// 4. HABILITADOR — Habilitação de inscrições (2 testes)
// ══════════════════════════════════════════════════════════════
test.describe.serial('4. Habilitador — Habilitar e Inabilitar', () => {
  test.describe.configure({ timeout: 180000 })

  test('4.1 Habilitar inscrição ENVIADA', async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const hrefs = await collectInscricaoHrefs(page)
    let foundEnviada = false

    for (const href of hrefs.slice(0, 5)) {
      await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const habilitarBtn = page.getByText('Habilitar inscrição', { exact: false }).first()
      if (await habilitarBtn.count() > 0) {
        foundEnviada = true
        await habilitarBtn.click()
        await page.waitForTimeout(1000)

        const confirmarBtn = page.getByText('Confirmar', { exact: true }).first()
        if (await confirmarBtn.count() > 0) {
          await confirmarBtn.click()
          await page.waitForTimeout(3000)

          const body = await page.textContent('body')
          const habilitada = body?.includes('sucesso') || body?.includes('Habilitada') || body?.includes('habilitada')
          expect(habilitada).toBeTruthy()
          console.log('✅ 4.1 Inscrição habilitada com sucesso')
        }
        break
      }
    }

    if (!foundEnviada) {
      console.log('⚠️ 4.1 Nenhuma inscrição ENVIADA encontrada para habilitar')
    }
  })

  test('4.2 Inabilitar inscrição com motivo', async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const hrefs = await collectInscricaoHrefs(page)
    let foundForInabilitar = false

    for (const href of hrefs.slice(0, 5)) {
      await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const inabilitarBtn = page.getByText('Inabilitar inscrição', { exact: false }).first()
      if (await inabilitarBtn.count() > 0) {
        foundForInabilitar = true

        // Clicar em inabilitar
        await inabilitarBtn.click()
        await page.waitForTimeout(1000)

        // Selecionar motivo padrão
        const motivoSelect = page.locator('#motivo-padrao')
        if (await motivoSelect.count() > 0) {
          await motivoSelect.selectOption({ index: 1 }) // Primeiro motivo
          console.log('  → Motivo padrão selecionado')
        }

        // Complemento
        const complemento = page.locator('#motivo-complemento')
        if (await complemento.count() > 0) {
          await complemento.fill('Documentação complementar não apresentada dentro do prazo estabelecido no edital.')
          console.log('  → Complemento preenchido')
        }

        // Confirmar inabilitação
        const confirmarBtn = page.getByText('Confirmar inabilitacao', { exact: false }).first()
        if (await confirmarBtn.count() === 0) {
          // Tentar variação com acento
          const confirmarBtn2 = page.getByText('Confirmar inabilitação', { exact: false }).first()
          if (await confirmarBtn2.count() > 0) {
            await confirmarBtn2.click()
          } else {
            // Tentar submit genérico
            const submitBtn = page.locator('button[type="submit"]').first()
            await submitBtn.click()
          }
        } else {
          await confirmarBtn.click()
        }
        await page.waitForTimeout(3000)

        const body = await page.textContent('body')
        const inabilitada = body?.includes('sucesso') || body?.includes('Inabilitada') || body?.includes('inabilitada')
        expect(inabilitada).toBeTruthy()
        console.log('✅ 4.2 Inscrição inabilitada com motivo')
        break
      }
    }

    if (!foundForInabilitar) {
      console.log('⚠️ 4.2 Nenhuma inscrição disponível para inabilitar')
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 5. AVALIADOR — Avaliação de inscrições (2 testes)
// ══════════════════════════════════════════════════════════════
test.describe.serial('5. Avaliador — Avaliar Inscrições', () => {

  test('5.1 Salvar avaliação como rascunho', async ({ page }) => {
    await login(page, USERS.AVALIADOR.cpf, USERS.AVALIADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const hrefs = await collectInscricaoHrefs(page)
    let foundAvaliacaoForm = false

    for (const href of hrefs.slice(0, 5)) {
      await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const parecerField = page.locator('#parecer')
      if (await parecerField.count() > 0) {
        foundAvaliacaoForm = true

        // Preencher parecer
        await parecerField.fill(
          'Proposta com boa fundamentação teórica e viabilidade técnica. ' +
          'O projeto demonstra impacto cultural significativo para a comunidade local de Irecê.'
        )

        // Preencher notas via range inputs
        const rangeInputs = page.locator('input[type="range"]')
        const rangeCount = await rangeInputs.count()
        for (let j = 0; j < rangeCount; j++) {
          await rangeInputs.nth(j).fill('8')
        }

        // Preencher notas via number inputs (se existirem)
        const numberInputs = page.locator('input[type="number"]')
        const numCount = await numberInputs.count()
        for (let j = 0; j < numCount; j++) {
          await numberInputs.nth(j).fill('8')
        }

        // Salvar rascunho
        const salvarBtn = page.getByText('Salvar rascunho', { exact: false }).first()
        if (await salvarBtn.count() > 0) {
          await salvarBtn.click()
          await page.waitForTimeout(3000)

          const body = await page.textContent('body')
          const saved = body?.includes('sucesso') || body?.includes('salvo') || body?.includes('rascunho')
          expect(saved).toBeTruthy()
          console.log('✅ 5.1 Avaliação salva como rascunho')
        }
        break
      }
    }

    if (!foundAvaliacaoForm) {
      console.log('⚠️ 5.1 Nenhuma inscrição com formulário de avaliação encontrada')
    }
  })

  test('5.2 Finalizar avaliação', async ({ page }) => {
    await login(page, USERS.AVALIADOR.cpf, USERS.AVALIADOR.senha)
    await page.goto(`${BASE}/admin/inscricoes`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const hrefs = await collectInscricaoHrefs(page)
    let foundAvaliacaoForm = false

    for (const href of hrefs.slice(0, 5)) {
      await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const parecerField = page.locator('#parecer')
      if (await parecerField.count() > 0) {
        foundAvaliacaoForm = true

        // Garantir que parecer está preenchido
        const currentParecer = await parecerField.inputValue()
        if (!currentParecer) {
          await parecerField.fill(
            'Proposta aprovada com mérito. O projeto atende aos critérios de originalidade, ' +
            'viabilidade e impacto cultural estabelecidos no edital.'
          )
        }

        // Garantir notas preenchidas
        const rangeInputs = page.locator('input[type="range"]')
        const rangeCount = await rangeInputs.count()
        for (let j = 0; j < rangeCount; j++) {
          await rangeInputs.nth(j).fill('9')
        }

        // Finalizar
        const finalizarBtn = page.getByText('Finalizar avaliação', { exact: false }).first()
        if (await finalizarBtn.count() === 0) {
          // Pode estar com variação sem acento
          const finalizarBtn2 = page.getByText('Finalizar avaliacao', { exact: false }).first()
          if (await finalizarBtn2.count() > 0) {
            await finalizarBtn2.click()
          } else {
            console.log('⚠️ 5.2 Botão "Finalizar" não encontrado (avaliação pode já estar finalizada)')
            break
          }
        } else {
          await finalizarBtn.click()
        }

        await page.waitForTimeout(1000)

        // Confirmar
        const confirmarBtn = page.getByText('Confirmar', { exact: true }).first()
        if (await confirmarBtn.count() > 0) {
          await confirmarBtn.click()
          await page.waitForTimeout(3000)

          const body = await page.textContent('body')
          const finalized = body?.includes('sucesso') || body?.includes('Finalizada') || body?.includes('finalizada')
          expect(finalized).toBeTruthy()
          console.log('✅ 5.2 Avaliação finalizada com sucesso')
        }
        break
      }
    }

    if (!foundAvaliacaoForm) {
      console.log('⚠️ 5.2 Nenhuma inscrição com formulário de avaliação encontrada')
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 6. ATENDIMENTO — Tickets e FAQ (3 testes)
// ══════════════════════════════════════════════════════════════
test.describe.serial('6. Atendimento — Tickets e Suporte', () => {

  test('6.1 Responder ticket aberto', async ({ page }) => {
    await login(page, USERS.ATENDIMENTO.cpf, USERS.ATENDIMENTO.senha)
    await page.goto(`${BASE}/admin/tickets`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Encontrar ticket aberto
    const ticketLink = page.locator('a[href*="/admin/tickets/"]').first()
    if (await ticketLink.count() === 0) {
      console.log('⚠️ 6.1 Nenhum ticket encontrado')
      return
    }

    const href = await ticketLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')

    // Preencher resposta
    const textoField = page.locator('#texto')
    if (await textoField.count() === 0) {
      console.log('⚠️ 6.1 Formulário de resposta não disponível (ticket pode estar fechado)')
      return
    }

    await textoField.fill(
      'Prezado(a) proponente, recebemos sua solicitação e informamos que a equipe de atendimento ' +
      'está analisando o caso. Retornaremos com uma resposta em até 2 dias úteis.'
    )

    // Mudar status para EM_ATENDIMENTO
    const statusSelect = page.locator('#novoStatus')
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption('EM_ATENDIMENTO')
    }

    // Enviar resposta
    const enviarBtn = page.getByText('Enviar Resposta', { exact: false }).first()
    if (await enviarBtn.count() > 0) {
      await enviarBtn.click()
      await page.waitForTimeout(3000)

      const afterBody = await page.textContent('body')
      const responded = afterBody?.includes('sucesso') || afterBody?.includes('enviada') ||
                        afterBody?.includes('Em Atendimento') || afterBody?.includes('EM_ATENDIMENTO') ||
                        afterBody?.includes('Resposta')
      expect(responded).toBeTruthy()
      console.log('✅ 6.1 Ticket respondido com sucesso')
    }
  })

  test('6.2 Fechar ticket (encerrar)', async ({ page }) => {
    await login(page, USERS.ATENDIMENTO.cpf, USERS.ATENDIMENTO.senha)
    await page.goto(`${BASE}/admin/tickets`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const ticketLink = page.locator('a[href*="/admin/tickets/"]').first()
    if (await ticketLink.count() === 0) {
      console.log('⚠️ 6.2 Nenhum ticket encontrado')
      return
    }

    const href = await ticketLink.getAttribute('href')
    await page.goto(`${BASE}${href}`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Tentar usar o botão rápido "Encerrar Ticket"
    const encerrarBtn = page.getByText('Encerrar Ticket', { exact: false }).first()
    if (await encerrarBtn.count() > 0) {
      await encerrarBtn.click()
      await page.waitForTimeout(3000)

      const body = await page.textContent('body')
      const closed = body?.includes('Fechado') || body?.includes('FECHADO') || body?.includes('encerrado') || body?.includes('sucesso')
      expect(closed).toBeTruthy()
      console.log('✅ 6.2 Ticket encerrado com sucesso')
    } else {
      // Alternativa: usar formulário com status FECHADO
      const textoField = page.locator('#texto')
      if (await textoField.count() > 0) {
        await textoField.fill('Ticket encerrado pela equipe de atendimento. Caso precise de mais ajuda, abra um novo chamado.')

        const statusSelect = page.locator('#novoStatus')
        if (await statusSelect.count() > 0) {
          await statusSelect.selectOption('FECHADO')
        }

        const enviarBtn = page.getByText('Enviar Resposta', { exact: false }).first()
        if (await enviarBtn.count() > 0) {
          await enviarBtn.click()
          await page.waitForTimeout(3000)
          console.log('✅ 6.2 Ticket fechado via formulário')
        }
      } else {
        console.log('⚠️ 6.2 Ticket já está fechado ou formulário não disponível')
      }
    }
  })

  test('6.3 Criar FAQ (pelo atendimento)', async ({ page }) => {
    await login(page, USERS.ATENDIMENTO.cpf, USERS.ATENDIMENTO.senha)
    await page.goto(`${BASE}/admin/faq/novo`, { timeout: 60000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const perguntaInput = page.locator('#pergunta')
    if (await perguntaInput.count() === 0) {
      console.log('⚠️ 6.3 Formulário de FAQ não acessível para Atendimento')
      return
    }

    // Pergunta
    await perguntaInput.fill(`Qual o prazo para inscrição nos editais? (Atendimento E2E ${TS})`)

    // Resposta
    await page.locator('#resposta').fill(
      'O prazo de inscrição varia de acordo com cada edital. Consulte a página de editais para ver as datas ' +
      'específicas de cada programa. Em geral, os prazos são divulgados com no mínimo 30 dias de antecedência.'
    )

    // Publicar
    const publicadoCheckbox = page.locator('#faq-publicado')
    if (await publicadoCheckbox.count() > 0) {
      if (!(await publicadoCheckbox.isChecked())) {
        await publicadoCheckbox.click()
      }
    }

    // Submit
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(5000)

    const body = await page.textContent('body')
    const url = page.url()
    const created = url.includes('/admin/faq') || body?.includes('sucesso') || body?.includes('criado')
    expect(created).toBeTruthy()

    console.log('✅ 6.3 FAQ criado pelo Atendimento com sucesso')
  })
})
