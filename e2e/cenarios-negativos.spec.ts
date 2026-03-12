import { test, expect } from '@playwright/test'
import { CREDENTIALS } from './helpers'

/* ──────────────────────────────────────────────────────────────────────────────
 * TESTE E2E — Cenarios Negativos e Tratamento de Erros
 *
 * Verifica que o sistema trata corretamente inputs invalidos e erros:
 *  1. Login com CPF inexistente → mensagem generica
 *  2. Login com senha errada → mensagem generica
 *  3. Registro com CPF duplicado → erro de conflito
 *  4. Acesso a edital inexistente → 404
 *  5. Submit de formulario com campos vazios → validacao
 *  6. Acesso a rota API inexistente → 404
 *  7. Newsletter com email invalido → erro
 *  8. Contato com campos faltando → erro
 *
 * Rodar: npx playwright test e2e/cenarios-negativos.spec.ts
 * ────────────────────────────────────────────────────────────────────────────── */

// ── Login — Cenarios negativos ───────────────────────────────────────────────

test.describe('Login — Erros de Autenticacao', () => {
  test.setTimeout(30_000)

  test('1. Login com CPF inexistente mostra mensagem generica', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })

    // CPF que nao existe no banco
    await page.locator('#cpf-ou-cnpj').fill('99999999999')
    await page.locator('#senha').fill('SenhaQualquer123')
    await page.locator('button[type="submit"]').click()

    // Deve mostrar erro generico (nao revelar se CPF existe ou nao)
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 15000 })

    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('incorretos')
    // Mensagem nao deve revelar se o CPF esta cadastrado ou nao
    expect(errorText).not.toContain('não encontrado')
    expect(errorText).not.toContain('não cadastrado')
  })

  test('2. Login com senha errada mostra mensagem generica', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })

    // CPF valido (seed) com senha errada
    await page.locator('#cpf-ou-cnpj').fill(CREDENTIALS.PROPONENTE.cpf)
    await page.locator('#senha').fill('SenhaErrada999')
    await page.locator('button[type="submit"]').click()

    // Mesma mensagem generica — nao deve diferenciar CPF invalido de senha errada
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 15000 })

    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('incorretos')
  })

  test('Login com campos vazios nao submete (validacao HTML)', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })

    // Nao preenche nada, tenta submeter
    await page.locator('button[type="submit"]').click()

    // O formulario usa noValidate, entao pode ou nao submeter.
    // Se submeter, deve falhar na API. De qualquer forma, nao deve redirecionar.
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toContain('/login')
  })
})

// ── Registro — Cenarios negativos ────────────────────────────────────────────

test.describe('Registro — Erros de Cadastro', () => {
  test.setTimeout(30_000)

  test('3. Registro com CPF ja cadastrado mostra erro de conflito', async ({
    page,
  }) => {
    // Chama a API diretamente para evitar preencher todo o formulario
    // e focar no teste da logica de duplicidade
    const res = await page.request.post('/api/auth/register', {
      data: {
        nome: 'Teste Duplicado',
        cpfCnpj: CREDENTIALS.PROPONENTE.cpf, // CPF do seed — ja existe
        email: 'duplicado@teste.com',
        telefone: '74999990000',
        cep: '44900000',
        logradouro: 'Rua Teste',
        numero: '1',
        bairro: 'Centro',
        cidade: 'Irece',
        uf: 'BA',
        password: 'Teste@123',
        tipoProponente: 'PF',
      },
    })

    expect(res.status()).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('CONFLICT')
    expect(body.message).toContain('já cadastrado')
  })

  test('Registro com senha curta mostra erro de validacao (client)', async ({
    page,
  }) => {
    await page.goto('/cadastro')
    await page.waitForLoadState('load')

    // Preencher campos minimos para passar pelas primeiras validacoes
    await page.getByLabel(/nome completo/i).fill('Teste Senha Curta')
    await page.getByLabel(/cpf/i).fill('11122233344')
    await page.getByLabel(/e-mail/i).fill('curta@teste.com')
    await page.getByLabel(/telefone/i).fill('(74) 99999-0000')

    // Endereco
    await page.getByLabel(/cep/i).fill('44900000')
    await page.getByLabel(/logradouro/i).fill('Rua Teste')
    await page.getByLabel(/bairro/i).fill('Centro')
    await page.getByLabel(/cidade/i).fill('Irece')
    await page.getByLabel(/uf/i).selectOption('BA')

    // Senha curta (< 8 caracteres)
    await page.getByLabel('Senha').fill('123')
    await page.getByLabel(/confirmar/i).fill('123')

    await page.getByRole('button', { name: /criar conta/i }).click()

    // Validacao client-side deve mostrar erro
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('8 caracteres')
  })

  test('Registro com senhas divergentes mostra erro', async ({ page }) => {
    await page.goto('/cadastro')
    await page.waitForLoadState('load')

    await page.getByLabel(/nome completo/i).fill('Teste Senhas Diferentes')
    await page.getByLabel(/cpf/i).fill('11122233355')
    await page.getByLabel(/e-mail/i).fill('divergente@teste.com')
    await page.getByLabel(/telefone/i).fill('(74) 99999-0000')

    await page.getByLabel(/cep/i).fill('44900000')
    await page.getByLabel(/logradouro/i).fill('Rua Teste')
    await page.getByLabel(/bairro/i).fill('Centro')
    await page.getByLabel(/cidade/i).fill('Irece')
    await page.getByLabel(/uf/i).selectOption('BA')

    await page.getByLabel('Senha').fill('Teste@123')
    await page.getByLabel(/confirmar/i).fill('OutraSenha@456')

    await page.getByRole('button', { name: /criar conta/i }).click()

    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('não coincidem')
  })

  test('Registro via API com dados invalidos retorna 400', async ({
    page,
  }) => {
    // Falta campos obrigatorios (nome, email)
    const res = await page.request.post('/api/auth/register', {
      data: {
        cpfCnpj: '99988877766',
        password: 'Teste@123',
        tipoProponente: 'PF',
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })
})

// ── Edital — Pagina inexistente ──────────────────────────────────────────────

test.describe('Edital — Acesso a Recurso Inexistente', () => {
  test.setTimeout(30_000)

  test('4. Acesso a edital com slug inexistente mostra 404 ou mensagem', async ({
    page,
  }) => {
    const res = await page.goto('/editais/edital-que-nao-existe-xyz-99999')
    await page.waitForLoadState('load')

    // Pode retornar 404 HTTP ou renderizar pagina com mensagem
    const status = res?.status()
    const body = await page.textContent('body')

    const is404 = status === 404
    const hasNotFoundMsg =
      body?.includes('não encontrado') ||
      body?.includes('Nao encontrado') ||
      body?.includes('404') ||
      body?.includes('Edital não encontrado') ||
      body?.includes('Página não encontrada')

    expect(is404 || hasNotFoundMsg).toBeTruthy()
  })
})

// ── Formulario — Validacao de campos obrigatorios ────────────────────────────

test.describe('Formulario — Validacao de Campos Obrigatorios', () => {
  test.setTimeout(30_000)

  test('5. Formulario de cadastro com endereco incompleto mostra erro', async ({
    page,
  }) => {
    await page.goto('/cadastro')
    await page.waitForLoadState('load')

    // Preenche dados pessoais mas omite endereco
    await page.getByLabel(/nome completo/i).fill('Teste Sem Endereco')
    await page.getByLabel(/cpf/i).fill('55566677788')
    await page.getByLabel(/e-mail/i).fill('semendereco@teste.com')
    await page.getByLabel(/telefone/i).fill('(74) 99999-0000')

    // Senha valida
    await page.getByLabel('Senha').fill('Teste@123')
    await page.getByLabel(/confirmar/i).fill('Teste@123')

    // Nao preenche CEP, logradouro, bairro, cidade, UF
    await page.getByRole('button', { name: /criar conta/i }).click()

    // Validacao client-side deve mostrar erro de endereco
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('endereco')
  })

  test('Formulario de contato sem nome mostra erro', async ({ page }) => {
    await page.goto('/contato')
    await page.waitForLoadState('load')

    // Preenche tudo menos o nome
    await page.locator('#e-mail').fill('teste@email.com')
    await page.locator('#assunto').fill('Teste de assunto')
    await page.locator('#mensagem').fill('Mensagem com mais de dez caracteres para passar')

    await page.getByRole('button', { name: /enviar/i }).click()

    // Validacao client-side
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })
    const errorText = await errorAlert.textContent()
    expect(errorText).toContain('nome')
  })
})

// ── API — Rotas inexistentes ─────────────────────────────────────────────────

test.describe('API — Rotas Inexistentes', () => {
  test.setTimeout(15_000)

  test('6. GET em rota API que nao existe retorna 404', async ({ page }) => {
    const res = await page.request.get('/api/rota-que-nao-existe')
    expect(res.status()).toBe(404)
  })

  test('POST em rota API inexistente retorna 404', async ({ page }) => {
    const res = await page.request.post('/api/admin/recurso-inexistente', {
      data: { test: true },
    })
    // 404 ou 405 (metodo nao permitido) — ambos sao aceitaveis
    expect([404, 405]).toContain(res.status())
  })
})

// ── Newsletter — Validacao ───────────────────────────────────────────────────

test.describe('Newsletter — Erros de Validacao', () => {
  test.setTimeout(15_000)

  test('7. Newsletter com email invalido retorna erro 400', async ({
    page,
  }) => {
    const res = await page.request.post('/api/newsletter', {
      data: {
        nome: 'Teste Newsletter',
        email: 'email-invalido-sem-arroba',
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
    expect(body.message).toContain('mail')
  })

  test('Newsletter sem nome retorna erro 400', async ({ page }) => {
    const res = await page.request.post('/api/newsletter', {
      data: {
        email: 'valido@email.com',
        // nome faltando
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  test('Newsletter com body vazio retorna erro', async ({ page }) => {
    const res = await page.request.post('/api/newsletter', {
      data: {},
    })

    expect(res.status()).toBe(400)
  })
})

// ── Contato — Validacao ──────────────────────────────────────────────────────

test.describe('Contato — Erros de Validacao', () => {
  test.setTimeout(15_000)

  test('8. Contato API sem campos obrigatorios retorna 400', async ({
    page,
  }) => {
    const res = await page.request.post('/api/contato', {
      data: {
        // Faltam todos os campos obrigatorios
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })

  test('Contato API com email invalido retorna 400', async ({ page }) => {
    const res = await page.request.post('/api/contato', {
      data: {
        nomeContato: 'Teste',
        emailContato: 'nao-eh-email',
        assunto: 'Teste de assunto',
        mensagem: 'Mensagem com mais de dez caracteres validos',
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
    expect(body.message).toContain('mail')
  })

  test('Contato API com mensagem muito curta retorna 400', async ({
    page,
  }) => {
    const res = await page.request.post('/api/contato', {
      data: {
        nomeContato: 'Teste',
        emailContato: 'valido@email.com',
        assunto: 'Teste',
        mensagem: 'Curta', // < 10 caracteres
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
    expect(body.message).toContain('10 caracteres')
  })

  test('Contato API com assunto vazio retorna 400', async ({ page }) => {
    const res = await page.request.post('/api/contato', {
      data: {
        nomeContato: 'Teste',
        emailContato: 'valido@email.com',
        assunto: '', // vazio
        mensagem: 'Mensagem com mais de dez caracteres validos',
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('VALIDATION_ERROR')
  })
})
