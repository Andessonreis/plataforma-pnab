import { test, expect } from '@playwright/test'

// Dados de teste para o fluxo completo
const timestamp = Date.now()
const testUser = {
  nome: `Teste E2E ${timestamp}`,
  cpf: '98765432100',
  email: `teste-e2e-${timestamp}@teste.com`,
  telefone: '(74) 99999-9999',
  cep: '44900000',
  logradouro: 'Rua Teste',
  numero: '100',
  bairro: 'Centro',
  cidade: 'Irece',
  uf: 'BA',
  senha: 'Teste@123',
}

test.describe('Caminho critico: cadastro → login → inscricao', () => {
  test('1. Pagina inicial carrega corretamente', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Portal PNAB/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('2. Pagina de editais carrega', async ({ page }) => {
    await page.goto('/editais')
    await expect(page.locator('h1')).toContainText('Editais')
  })

  test('3. Cadastro de proponente PF', async ({ page }) => {
    await page.goto('/cadastro')

    // Selecionar tipo PF (ja vem selecionado por padrao)
    await expect(page.getByRole('button', { name: 'Pessoa Física' })).toHaveAttribute('aria-pressed', 'true')

    // Preencher formulario
    await page.getByLabel(/nome completo/i).fill(testUser.nome)
    await page.getByLabel(/cpf/i).fill(testUser.cpf)
    await page.getByLabel(/e-mail/i).fill(testUser.email)
    await page.getByLabel(/telefone/i).fill(testUser.telefone)

    // Endereco
    await page.getByLabel(/cep/i).fill(testUser.cep)
    await page.getByLabel(/logradouro/i).fill(testUser.logradouro)
    await page.getByLabel(/numero/i).fill(testUser.numero)
    await page.getByLabel(/bairro/i).fill(testUser.bairro)
    await page.getByLabel(/cidade/i).fill(testUser.cidade)
    await page.getByLabel(/uf/i).selectOption(testUser.uf)

    // Senha
    await page.getByLabel('Senha').fill(testUser.senha)
    await page.getByLabel(/confirmar/i).fill(testUser.senha)

    // Submeter
    await page.getByRole('button', { name: /criar conta/i }).click()

    // Deve redirecionar para login com parametro de sucesso
    await page.waitForURL(/\/login\?cadastro=sucesso/, { timeout: 10000 })
    await expect(page.url()).toContain('/login')
  })

  test('4. Login com CPF e senha', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/cpf/i).fill(testUser.cpf)
    await page.getByLabel(/senha/i).fill(testUser.senha)
    await page.getByRole('button', { name: /entrar/i }).click()

    // Deve redirecionar para area do proponente
    await page.waitForURL(/\/proponente/, { timeout: 10000 })
    await expect(page.url()).toContain('/proponente')
  })

  test('5. Area do proponente carrega', async ({ page }) => {
    // Logar primeiro
    await page.goto('/login')
    await page.getByLabel(/cpf/i).fill(testUser.cpf)
    await page.getByLabel(/senha/i).fill(testUser.senha)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/proponente/, { timeout: 10000 })

    // Verificar dashboard do proponente
    await expect(page.locator('main')).toBeVisible()
  })

  test('6. Historico de inscricoes acessivel', async ({ page }) => {
    // Logar
    await page.goto('/login')
    await page.getByLabel(/cpf/i).fill(testUser.cpf)
    await page.getByLabel(/senha/i).fill(testUser.senha)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/proponente/, { timeout: 10000 })

    // Navegar para inscricoes
    await page.goto('/proponente/inscricoes')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('7. Perfil do proponente carrega com endereco', async ({ page }) => {
    // Logar
    await page.goto('/login')
    await page.getByLabel(/cpf/i).fill(testUser.cpf)
    await page.getByLabel(/senha/i).fill(testUser.senha)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/\/proponente/, { timeout: 10000 })

    // Navegar para perfil
    await page.goto('/proponente/perfil')
    await expect(page.getByText(testUser.nome)).toBeVisible()
  })
})

test.describe('Paginas publicas', () => {
  test('FAQ carrega', async ({ page }) => {
    await page.goto('/faq')
    await expect(page.locator('h1')).toContainText('FAQ')
  })

  test('Contato carrega', async ({ page }) => {
    await page.goto('/contato')
    await expect(page.locator('h1')).toContainText('Contato')
  })

  test('Projetos apoiados carrega', async ({ page }) => {
    await page.goto('/projetos-apoiados')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Noticias carrega', async ({ page }) => {
    await page.goto('/noticias')
    await expect(page.locator('h1')).toContainText(/not[ií]cias/i)
  })
})

test.describe('Admin — acesso com credenciais seed', () => {
  test('Login como admin e acesso ao dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/cpf/i).fill('00000000001')
    await page.getByLabel(/senha/i).fill('Teste@123')
    await page.getByRole('button', { name: /entrar/i }).click()

    await page.waitForURL(/\/admin/, { timeout: 10000 })
    await expect(page.url()).toContain('/admin')
  })
})
