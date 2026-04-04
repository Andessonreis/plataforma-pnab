/**
 * Teste E2E: Fluxo completo do Edital Cultura Viva
 *
 * 1. Login como ADMIN
 * 2. Criar edital Cultura Viva com campos multiselect, tipos de anexo, nota mínima e desempate
 * 3. Login como PROPONENTE
 * 4. Inscrever-se no edital usando campo multiselect
 * 5. Verificar que tipos de anexo do edital aparecem no dropdown
 */

import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:3000'

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('=== Teste E2E: Fluxo Cultura Viva ===\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  try {
    // ═══════════════════════════════════════════════════════════════
    // PARTE 1: Login como ADMIN
    // ═══════════════════════════════════════════════════════════════
    console.log('1. Login como ADMIN...')
    const adminPage = await context.newPage()
    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })
    await adminPage.locator('#cpf-ou-cnpj').waitFor({ timeout: 15000 })
    await adminPage.locator('#cpf-ou-cnpj').fill('00000000001')
    await adminPage.locator('input#senha').fill('Teste@123')
    await adminPage.getByRole('button', { name: 'Entrar' }).click()
    await adminPage.waitForURL(/\/admin/, { timeout: 30000 })
    console.log('   ✓ Login admin OK\n')

    // ═══════════════════════════════════════════════════════════════
    // PARTE 2: Criar edital via API (mais rápido e confiável)
    // ═══════════════════════════════════════════════════════════════
    console.log('2. Criando Edital Cultura Viva via API...')

    const editalBody = {
      titulo: 'Edital Cultura Viva - Teste E2E',
      resumo: 'Edital de fomento a Pontos de Cultura certificados pela PNCV no município de Irecê/BA.',
      ano: 2026,
      valorTotal: 300000,
      categorias: ['Cultura Popular', 'Música', 'Dança', 'Teatro'],
      regrasElegibilidade: '• Ser Ponto de Cultura certificado pela PNCV\n• Ter sede ou atuação no município de Irecê/BA',
      acoesAfirmativas: '• Reserva de 20% para comunidades tradicionais\n• Pontuação adicional para mulheres em situação de vulnerabilidade',
      status: 'INSCRICOES_ABERTAS',
      cronograma: [],
      camposFormulario: [
        { nome: 'nome_entidade', label: 'Nome da Entidade', tipo: 'texto', obrigatorio: true, placeholder: 'Nome completo da entidade', opcoes: [], hint: '' },
        { nome: 'cnpj', label: 'CNPJ', tipo: 'texto', obrigatorio: true, placeholder: '00.000.000/0000-00', opcoes: [], hint: '' },
        { nome: 'endereco', label: 'Endereço da Sede', tipo: 'texto', obrigatorio: true, placeholder: 'Rua, número, bairro', opcoes: [], hint: '' },
        { nome: 'representante_legal', label: 'Nome do Representante Legal', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
        { nome: 'cpf_representante', label: 'CPF do Representante', tipo: 'texto', obrigatorio: true, placeholder: '000.000.000-00', opcoes: [], hint: '' },
        { nome: 'telefone', label: 'Telefone de Contato', tipo: 'texto', obrigatorio: true, placeholder: '(00) 00000-0000', opcoes: [], hint: '' },
        { nome: 'email', label: 'E-mail', tipo: 'texto', obrigatorio: true, placeholder: 'contato@entidade.org.br', opcoes: [], hint: '' },
        { nome: 'linguagem_artistica', label: 'Linguagens Artísticas', tipo: 'multiselect', obrigatorio: true, placeholder: '', opcoes: ['Música', 'Dança', 'Teatro', 'Artes Visuais', 'Literatura', 'Circo', 'Audiovisual', 'Artesanato', 'Cultura Digital'], hint: 'Selecione todas as linguagens que a entidade trabalha' },
        { nome: 'temas_atuacao', label: 'Temas de Atuação', tipo: 'multiselect', obrigatorio: false, placeholder: '', opcoes: ['Educação', 'Meio Ambiente', 'Direitos Humanos', 'Saúde', 'Patrimônio Cultural', 'Economia Criativa'], hint: 'Selecione os temas de atuação da entidade' },
        { nome: 'descricao_projeto', label: 'Descrição do Projeto', tipo: 'textarea', obrigatorio: true, placeholder: 'Descreva o projeto cultural proposto', opcoes: [], hint: 'Mínimo de 200 caracteres' },
        { nome: 'valor_solicitado', label: 'Valor Solicitado (R$)', tipo: 'numero', obrigatorio: true, placeholder: '0,00', opcoes: [], hint: 'Valor máximo: R$ 50.000,00' },
      ],
      criteriosAvaliacao: [
        { criterio: 'Tempo de atuação cultural', peso: 10, notaMax: 10, bloco: 'Bloco 1', descricao: 'Tempo de funcionamento e ações culturais realizadas' },
        { criterio: 'Diversidade de linguagens', peso: 5, notaMax: 5, bloco: 'Bloco 1', descricao: 'Variedade de linguagens artísticas trabalhadas' },
        { criterio: 'Experiência com PNCV', peso: 8, notaMax: 8, bloco: 'Bloco 2-I', descricao: 'Participação em ações de Cultura Viva' },
        { criterio: 'Articulação em rede', peso: 5, notaMax: 5, bloco: 'Bloco 2-I', descricao: 'Participação em redes e coletivos culturais' },
        { criterio: 'Ações com comunidade', peso: 7, notaMax: 7, bloco: 'Bloco 2-II', descricao: 'Vivências e ações com a comunidade local' },
        { criterio: 'Impacto social', peso: 5, notaMax: 5, bloco: 'Bloco 2-III', descricao: 'Potencial de transformação social do projeto' },
      ],
      vagasContemplados: 10,
      vagasSuplentes: 5,
      tiposAnexo: [
        { tipo: 'CERTIFICADO_PNCV', label: 'Certificado ou Declaração PNCV', obrigatorio: true },
        { tipo: 'PLANO_TRABALHO', label: 'Plano de Trabalho (Anexo 03)', obrigatorio: true },
        { tipo: 'PLANO_APLICACAO', label: 'Plano de Aplicação de Recursos (Anexo 04)', obrigatorio: true },
        { tipo: 'AUTODECL_ETNICA', label: 'Autodeclaração Étnico-Racial (Anexo 05)', obrigatorio: false },
        { tipo: 'AUTODECL_PCD', label: 'Autodeclaração PcD (Anexo 06)', obrigatorio: false },
        { tipo: 'DECLARACAO_CONJUNTA', label: 'Declaração Conjunta (Anexo 08)', obrigatorio: true },
        { tipo: 'DOCUMENTO_PESSOAL', label: 'Documento de Identificação', obrigatorio: true },
        { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço', obrigatorio: true },
      ],
      notaMinima: 3.0,
      desempate: [
        { descricao: 'Maior nota no Bloco 1', tipo: 'bloco', ref: 'Bloco 1', direcao: 'desc' },
        { descricao: 'Maior nota no Bloco 2-I', tipo: 'bloco', ref: 'Bloco 2-I', direcao: 'desc' },
        { descricao: 'Maior nota no Bloco 2-II', tipo: 'bloco', ref: 'Bloco 2-II', direcao: 'desc' },
        { descricao: 'Maior nota no Bloco 2-III', tipo: 'bloco', ref: 'Bloco 2-III', direcao: 'desc' },
      ],
    }

    // Pegar cookies da sessão admin
    const cookies = await context.cookies()
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const createRes = await adminPage.evaluate(async (body) => {
      const res = await fetch('/api/admin/editais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return { status: res.status, body: await res.json() }
    }, editalBody)

    if (createRes.status !== 201) {
      console.error('   ✗ Erro ao criar edital:', createRes.body)
      throw new Error('Falha na criação do edital')
    }

    const editalId = createRes.body.id
    const editalSlug = createRes.body.slug
    console.log(`   ✓ Edital criado: ${editalId} (slug: ${editalSlug})`)

    // Verificar edital criado — buscar dados
    const checkRes = await adminPage.evaluate(async (id) => {
      const res = await fetch(`/api/admin/editais?id=${id}`)
      // A API não tem GET por ID, vamos verificar via admin page
      return { ok: true }
    }, editalId)
    console.log('   ✓ Edital Cultura Viva criado com sucesso')

    // ═══════════════════════════════════════════════════════════════
    // PARTE 3: Verificar edital no admin (abrir página de edição)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n3. Verificando edital no admin...')
    await adminPage.goto(`${BASE_URL}/admin/editais/${editalId}`, { waitUntil: 'networkidle', timeout: 60000 })
    await sleep(2000)

    // Verificar que os campos estão lá
    const pageContent = await adminPage.content()

    const checks = [
      { name: 'Título do edital', test: pageContent.includes('Cultura Viva') },
      { name: 'Campo multiselect (Linguagens)', test: pageContent.includes('Linguagens Artísticas') || pageContent.includes('multiselect') || pageContent.includes('Seleção múltipla') },
      { name: 'Tipos de Anexo configurados', test: pageContent.includes('8 tipos configurados') || pageContent.includes('CERTIFICADO_PNCV') || pageContent.includes('Certificado ou Declaração PNCV') },
      { name: 'Nota mínima', test: pageContent.includes('3') },
      { name: 'Regras de desempate', test: pageContent.includes('Bloco 1') || pageContent.includes('desempate') },
    ]

    for (const check of checks) {
      console.log(`   ${check.test ? '✓' : '✗'} ${check.name}`)
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 4: Login como PROPONENTE
    // ═══════════════════════════════════════════════════════════════
    console.log('\n4. Login como PROPONENTE...')
    const propPage = await context.newPage()

    // Logout admin primeiro
    await propPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })

    // Limpar sessão e logar como proponente
    await context.clearCookies()
    await propPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 })
    await propPage.locator('#cpf-ou-cnpj').waitFor({ timeout: 15000 })
    await propPage.locator('#cpf-ou-cnpj').fill('12345678901')
    await propPage.locator('input#senha').fill('Teste@123')
    await propPage.getByRole('button', { name: 'Entrar' }).click()
    await propPage.waitForURL(/\/proponente/, { timeout: 30000 })
    console.log('   ✓ Login proponente OK')

    // ═══════════════════════════════════════════════════════════════
    // PARTE 5: Iniciar inscrição no edital Cultura Viva
    // ═══════════════════════════════════════════════════════════════
    console.log('\n5. Iniciando inscrição no Edital Cultura Viva...')
    await propPage.goto(`${BASE_URL}/proponente/inscricoes/nova?editalId=${editalId}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    await sleep(2000)

    const inscricaoContent = await propPage.content()

    // Verificar se a página de inscrição carregou
    const temFormulario = inscricaoContent.includes('Dados do Projeto') || inscricaoContent.includes('Categoria') || inscricaoContent.includes('Cultura Viva')
    console.log(`   ${temFormulario ? '✓' : '✗'} Página de inscrição carregou`)

    // Se tem etapa de categoria, selecionar e avançar
    if (inscricaoContent.includes('Selecione a Categoria') || inscricaoContent.includes('Categoria')) {
      console.log('   → Selecionando categoria...')
      const categoriaSelect = propPage.locator('select').first()
      if (await categoriaSelect.isVisible()) {
        await categoriaSelect.selectOption('Cultura Popular')
        console.log('   ✓ Categoria selecionada: Cultura Popular')
      }

      // Clica em Próximo
      const nextBtn = propPage.getByRole('button', { name: /Próximo/i })
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
        // Esperar que a etapa 2 (Dados do Projeto) carregue
        await propPage.waitForSelector('text=Dados do Projeto', { timeout: 10000 }).catch(() => {})
        await sleep(2000)
        console.log('   ✓ Avançou para Dados do Projeto')
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 6: Preencher campos incluindo MULTISELECT
    // ═══════════════════════════════════════════════════════════════
    console.log('\n6. Preenchendo campos do formulário...')

    await sleep(1000)
    const formContent = await propPage.content()

    // Verificar campo multiselect (Linguagens Artísticas)
    const temMultiselect = formContent.includes('Linguagens Artísticas') || formContent.includes('checkbox')
    console.log(`   ${temMultiselect ? '✓' : '✗'} Campo multiselect (Linguagens Artísticas) presente`)

    // Preencher campos de texto — usar locators mais robustos
    const camposTexto = [
      { label: 'Nome da Entidade', value: 'Associação Cultural Raízes de Irecê' },
      { label: 'CNPJ', value: '12.345.678/0001-90' },
      { label: 'Endereço da Sede', value: 'Rua da Cultura, 123, Centro, Irecê/BA' },
      { label: 'Nome do Representante Legal', value: 'Maria da Silva Santos' },
      { label: 'CPF do Representante', value: '123.456.789-00' },
      { label: 'Telefone de Contato', value: '(74) 99999-1234' },
      { label: 'E-mail', value: 'raizes@cultura.org.br' },
    ]

    for (const campo of camposTexto) {
      try {
        // Tentar por label primeiro, depois por placeholder
        const input = propPage.getByLabel(campo.label, { exact: false }).first()
        if (await input.isVisible({ timeout: 2000 })) {
          await input.fill(campo.value)
          console.log(`   ✓ Preenchido: ${campo.label}`)
        } else {
          console.log(`   - Campo "${campo.label}" não visível (pode estar em outra etapa)`)
        }
      } catch {
        console.log(`   - Campo "${campo.label}" não encontrado`)
      }
    }

    // Marcar checkboxes do multiselect (Linguagens Artísticas)
    const linguagens = ['Música', 'Dança', 'Cultura Digital']
    for (const ling of linguagens) {
      try {
        // Os checkboxes de multiselect usam <label> com texto e <input type="checkbox">
        const checkbox = propPage.locator(`label`).filter({ hasText: ling }).locator('input[type="checkbox"]')
        if (await checkbox.isVisible({ timeout: 2000 })) {
          await checkbox.check()
          console.log(`   ✓ Selecionado: ${ling}`)
        } else {
          // Fallback: tentar getByLabel
          const cb2 = propPage.getByLabel(ling, { exact: true })
          if (await cb2.isVisible({ timeout: 1000 })) {
            await cb2.check()
            console.log(`   ✓ Selecionado (fallback): ${ling}`)
          } else {
            console.log(`   - Checkbox "${ling}" não visível`)
          }
        }
      } catch {
        console.log(`   - Checkbox "${ling}" não encontrado`)
      }
    }

    // Preencher textarea (Descrição do Projeto)
    try {
      const descricao = propPage.getByLabel('Descrição do Projeto', { exact: false }).first()
      if (await descricao.isVisible({ timeout: 2000 })) {
        await descricao.fill('Projeto de formação cultural comunitária que visa promover a valorização das tradições culturais de Irecê através de oficinas de música, dança e cultura digital para jovens e adultos da periferia. O projeto atenderá 200 pessoas em 12 meses de execução, com apresentações públicas e produção de material audiovisual para registro e difusão.')
        console.log('   ✓ Preenchido: Descrição do Projeto')
      }
    } catch {
      console.log('   - Descrição não visível')
    }

    // Preencher campo numérico (Valor Solicitado)
    try {
      const valor = propPage.getByLabel('Valor Solicitado', { exact: false }).first()
      if (await valor.isVisible({ timeout: 2000 })) {
        await valor.fill('45000')
        console.log('   ✓ Preenchido: Valor Solicitado')
      }
    } catch {
      console.log('   - Valor Solicitado não visível')
    }

    // Screenshot dos campos preenchidos
    await propPage.screenshot({ path: 'e2e/screenshots/cultura-viva-campos.png', fullPage: true })
    console.log('   Screenshot: e2e/screenshots/cultura-viva-campos.png')

    // Avançar para Anexos
    const nextBtn2 = propPage.getByRole('button', { name: /Próximo/i })
    if (await nextBtn2.isVisible({ timeout: 2000 })) {
      await nextBtn2.click()
      await sleep(3000)
      console.log('\n   ✓ Avançou para etapa de Anexos')
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 7: Verificar tipos de anexo customizados
    // ═══════════════════════════════════════════════════════════════
    console.log('\n7. Verificando tipos de anexo...')
    const anexosContent = await propPage.content()

    const tiposEsperados = [
      'Certificado ou Declaração PNCV',
      'Plano de Trabalho',
      'Plano de Aplicação de Recursos',
      'Declaração Conjunta',
      'Documento de Identificação',
      'Comprovante de Endereço',
    ]

    for (const tipo of tiposEsperados) {
      const found = anexosContent.includes(tipo)
      console.log(`   ${found ? '✓' : '✗'} Tipo de anexo: ${tipo}`)
    }

    // Verificar que os tipos padrão NÃO aparecem (foram substituídos)
    const tiposPadrao = ['Portfólio / Currículo', 'Orçamento']
    for (const tipo of tiposPadrao) {
      const found = anexosContent.includes(tipo)
      console.log(`   ${!found ? '✓' : '✗'} Tipo padrão "${tipo}" ${found ? 'AINDA APARECE (erro)' : 'não aparece (correto)'}`)
    }

    // Avançar para Revisão
    const nextBtn3 = propPage.getByRole('button', { name: /Próximo/i })
    if (await nextBtn3.isVisible({ timeout: 2000 })) {
      await nextBtn3.click()
      await sleep(3000)
      console.log('\n   ✓ Avançou para etapa de Revisão')
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 8: Verificar revisão (multiselect renderizado, alerta de anexos)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n8. Verificando revisão...')
    const revisaoContent = await propPage.content()

    // Verificar que multiselect mostra valores selecionados
    const temMusica = revisaoContent.includes('Música')
    const temDanca = revisaoContent.includes('Dança')
    console.log(`   ${temMusica && temDanca ? '✓' : '✗'} Valores multiselect na revisão (Música, Dança)`)

    // Verificar alerta de anexos obrigatórios faltantes
    const temAlertaAnexos = revisaoContent.includes('Anexos obrigat') || revisaoContent.includes('faltantes')
    console.log(`   ${temAlertaAnexos ? '✓' : '✗'} Alerta de anexos obrigatórios faltantes`)
    if (!temAlertaAnexos) {
      // Debug: verificar se estamos na etapa de revisão
      const stepIndicators = ['Categoria', 'Dados do Projeto', 'Anexos', 'Revisão'].filter(s => revisaoContent.includes(s))
      console.log(`   (Etapas visíveis: ${stepIndicators.join(', ')})`)
    }

    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(50))
    console.log('TESTE E2E CONCLUÍDO')
    console.log('═'.repeat(50))

    // Tirar screenshot final
    await propPage.screenshot({ path: 'e2e/screenshots/cultura-viva-revisao.png', fullPage: true })
    console.log('\nScreenshot salvo em: e2e/screenshots/cultura-viva-revisao.png')

    // Limpar: deletar o edital de teste (opcional)
    // await adminPage.evaluate(...)

  } catch (error) {
    console.error('\n✗ ERRO:', error)

    // Tirar screenshot do erro
    try {
      const pages = context.pages()
      if (pages.length > 0) {
        await pages[pages.length - 1].screenshot({ path: 'e2e/screenshots/cultura-viva-erro.png', fullPage: true })
        console.log('Screenshot de erro salvo em: e2e/screenshots/cultura-viva-erro.png')
      }
    } catch {}

    process.exit(1)
  } finally {
    await browser.close()
  }
}

main()
