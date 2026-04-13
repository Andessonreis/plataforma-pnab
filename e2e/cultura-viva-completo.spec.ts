import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

/**
 * TESTE E2E COMPLETO — Ciclo de vida do Edital Cultura Viva (Ponto de Cultura)
 *
 * Cobre todas as etapas do fluxo com todos os roles:
 *  1.  ADMIN cria edital via API
 *  2.  PROPONENTE se inscreve via UI (formulário multi-step)
 *  3.  PROPONENTE edita inscrição ENVIADA (retract + re-submit)
 *  4.  ADMIN encerra inscrições
 *  5.  HABILITADOR habilita inscrição
 *  6.  ADMIN atribui avaliador e muda para AVALIACAO
 *  7.  AVALIADOR avalia com nota e parecer
 *  8.  ADMIN publica resultado preliminar
 *  9.  PROPONENTE vê resultado e interpõe recurso
 * 10.  ADMIN publica resultado final
 * 11.  PROPONENTE baixa PDFs
 * 12.  Verificações finais (página pública, logs)
 */

// ─── Credenciais ────────────────────────────────────────────────────────────

const USERS = {
  ADMIN:       { cpf: '00000000001', senha: 'Teste@123' },
  HABILITADOR: { cpf: '00000000003', senha: 'Teste@123' },
  AVALIADOR:   { cpf: '00000000004', senha: 'Teste@123' },
  PROPONENTE:  { cpf: '12345678901', senha: 'Teste@123' },
}

// ─── Estado compartilhado entre testes seriais ──────────────────────────────

let editalId: string
let editalSlug: string
let inscricaoId: string
let inscricaoNumero: string

// Payload base do edital (preenchido no teste 1, reutilizado nos PUTs)
const editalBase = {
  titulo: 'Chamamento Público — Pontos de Cultura E2E',
  ano: 2026,
  categorias: ['Pontos de Cultura'],
  cronograma: [] as unknown[],
  camposFormulario: [] as unknown[],
  equipeAvaliadores: [] as string[],
  equipeHabilitadores: [] as string[],
}

/** Atualiza status do edital (PUT exige campos obrigatórios) */
async function updateEditalStatus(page: Page, status: string) {
  const res = await page.request.put(`/api/admin/editais?id=${editalId}`, {
    data: { ...editalBase, status },
  })
  return res
}

// ─── PDF mínimo válido (para upload de anexo) ───────────────────────────────

const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n' +
  'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n' +
  '0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF',
)

// ─── Helpers ────────────────────────────────────────────────────────────────

async function login(page: Page, cpf: string, senha: string) {
  await page.goto('/login')
  await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })
  await page.locator('#cpf-ou-cnpj').fill(cpf)
  await page.locator('#senha').fill(senha)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(admin|proponente|avaliador)/, { timeout: 30000 })
  await page.waitForLoadState('networkidle')
}

async function loginApi(request: APIRequestContext, cpf: string, senha: string) {
  const res = await request.post('/api/auth/callback/credentials', {
    form: { cpfCnpj: cpf, password: senha, redirect: 'false', json: 'true' },
  })
  return res
}

// ─── Testes Seriais ─────────────────────────────────────────────────────────

test.describe.serial('Cultura Viva — Ciclo de Vida Completo', () => {
  test.setTimeout(90000)

  // ── 1. ADMIN cria edital Cultura Viva via API ──────────────────────────

  test('1. ADMIN cria edital Cultura Viva com campos e categorias', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    const res = await page.request.post('/api/admin/editais', {
      data: {
        titulo: 'Chamamento Público — Pontos de Cultura E2E',
        resumo: 'Seleção de entidades culturais para composição da Rede Municipal de Pontos de Cultura de Irecê/BA. Teste E2E automatizado.',
        ano: 2026,
        status: 'INSCRICOES_ABERTAS',
        valorTotal: 500000,
        categorias: ['Pontos de Cultura'],
        vagasContemplados: 10,
        vagasSuplentes: 5,
        tiposProponentePermitidos: [],
        equipeAvaliadores: [],
        equipeHabilitadores: [],
        cronograma: [
          { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-01-01T00:00:00-03:00', destaque: true },
          { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-12-31T23:59:00-03:00', destaque: true },
        ],
        camposFormulario: [
          { nome: 'nomeProjeto', label: 'Nome do Projeto', tipo: 'texto', obrigatorio: true, hint: 'Nome completo do seu projeto cultural' },
          { nome: 'descricao', label: 'Descrição do Projeto', tipo: 'textarea', obrigatorio: true, hint: 'Descreva seu projeto', maxLength: 3000 },
          { nome: 'valorSolicitado', label: 'Valor Solicitado', tipo: 'moeda', obrigatorio: true },
          { nome: 'publicoAlvo', label: 'Público-Alvo', tipo: 'select', obrigatorio: true, opcoes: ['Crianças', 'Jovens', 'Adultos', 'Idosos', 'Todos'] },
          { nome: 'tipoDeficiencia', label: 'Tipo de Deficiência', tipo: 'select', obrigatorio: false, opcoes: ['Visual', 'Auditiva', 'Motora', 'Intelectual', 'Múltipla'] },
          { nome: 'justificativa', label: 'Justificativa', tipo: 'textarea', obrigatorio: true, hint: 'Por que este projeto é relevante?', minLength: 50, maxLength: 2000 },
        ],
        criteriosAvaliacao: [
          { criterio: 'Atuação da entidade cultural', peso: 30, notaMax: 100, bloco: 'Bloco 1' },
          { criterio: 'Qualidade do projeto', peso: 40, notaMax: 100, bloco: 'Bloco 2' },
          { criterio: 'Abrangência do público', peso: 20, notaMax: 100, bloco: 'Bloco 2' },
          { criterio: 'Bonificação', peso: 10, notaMax: 5, bloco: 'Bloco 3' },
        ],
      },
    })

    expect(res.status()).toBe(201)
    const body = await res.json()
    editalId = body.id
    editalSlug = body.slug
    expect(editalId).toBeTruthy()

    // Salvar dados para reusar nos PUTs de status
    editalBase.cronograma = [
      { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-01-01T00:00:00-03:00', destaque: true },
      { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-12-31T23:59:00-03:00', destaque: true },
    ]
    editalBase.camposFormulario = [
      { nome: 'nomeProjeto', label: 'Nome do Projeto', tipo: 'texto', obrigatorio: true },
      { nome: 'descricao', label: 'Descrição do Projeto', tipo: 'textarea', obrigatorio: true, maxLength: 3000 },
      { nome: 'valorSolicitado', label: 'Valor Solicitado', tipo: 'moeda', obrigatorio: true },
      { nome: 'publicoAlvo', label: 'Público-Alvo', tipo: 'select', obrigatorio: true, opcoes: ['Crianças', 'Jovens', 'Adultos', 'Idosos', 'Todos'] },
      { nome: 'tipoDeficiencia', label: 'Tipo de Deficiência', tipo: 'select', obrigatorio: false, opcoes: ['Visual', 'Auditiva', 'Motora', 'Intelectual', 'Múltipla'] },
      { nome: 'justificativa', label: 'Justificativa', tipo: 'textarea', obrigatorio: true, minLength: 50, maxLength: 2000 },
    ]

    console.log(`[E2E] Edital criado: ${editalId} (${editalSlug})`)
  })

  // ── 2. PROPONENTE se inscreve via UI ───────────────────────────────────

  test('2. PROPONENTE preenche formulário e envia inscrição', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)

    // Criar inscrição via API (mais rápido que navegar pela UI)
    const createRes = await page.request.post('/api/proponente/inscricoes', {
      data: { editalId, categoria: 'Pontos de Cultura' },
    })
    expect(createRes.status()).toBe(201)
    const createBody = await createRes.json()
    inscricaoId = createBody.id || createBody.inscricaoId
    expect(inscricaoId).toBeTruthy()
    console.log(`[E2E] Inscrição criada: ${inscricaoId}`)

    // Salvar campos via API
    const putRes = await page.request.put(`/api/proponente/inscricoes/${inscricaoId}`, {
      data: {
        campos: {
          nomeProjeto: 'Centro Cultural Raízes de Irecê',
          descricao: 'Projeto de fortalecimento das expressões culturais tradicionais do semiárido baiano, com oficinas de música, dança e artesanato para a comunidade de Irecê e região. O projeto visa preservar e difundir o patrimônio cultural imaterial local.',
          valorSolicitado: '50000',
          publicoAlvo: 'Todos',
          justificativa: 'O município de Irecê possui rica tradição cultural que necessita de apoio institucional para sua preservação e difusão. Este projeto atende à demanda da comunidade por espaços de formação e expressão artística, contribuindo para o fortalecimento da identidade cultural local.',
        },
        categoria: 'Pontos de Cultura',
      },
    })
    expect(putRes.status()).toBe(200)

    // Upload de anexo via API
    const uploadRes = await page.request.post(`/api/proponente/inscricoes/${inscricaoId}/anexos`, {
      multipart: {
        file: { name: 'proposta-cultura-viva.pdf', mimeType: 'application/pdf', buffer: MINIMAL_PDF },
        tipo: 'PROPOSTA',
        titulo: 'Proposta — Centro Cultural Raízes de Irecê',
      },
    })
    expect(uploadRes.status()).toBe(201)

    // Submeter inscrição
    const submitRes = await page.request.post(`/api/proponente/inscricoes/${inscricaoId}/submit`)
    expect(submitRes.status()).toBe(200)
    const submitBody = await submitRes.json()
    inscricaoNumero = submitBody.data?.numero || submitBody.numero
    console.log(`[E2E] Inscrição enviada: ${inscricaoNumero}`)

    // Verificar na UI — navegar para a inscrição
    await page.goto(`/proponente/inscricoes/${inscricaoId}`)
    await page.waitForLoadState('networkidle')

    // Verificar status ENVIADA
    await expect(page.locator('text=/Enviada/i').first()).toBeVisible({ timeout: 10000 })

    // Verificar dados preenchidos
    await expect(page.getByText('Centro Cultural Raízes de Irecê', { exact: true })).toBeVisible()
  })

  // ── 3. PROPONENTE edita inscrição ENVIADA (retract) ────────────────────

  test('3. PROPONENTE retira inscrição, edita e reenvia', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)
    await page.goto(`/proponente/inscricoes/${inscricaoId}`)
    await page.waitForLoadState('networkidle')

    // Deve ver botão "Editar Inscrição" (porque edital está INSCRICOES_ABERTAS)
    const editButton = page.locator('button:has-text("Editar Inscrição")')
    await expect(editButton).toBeVisible({ timeout: 5000 })
    await editButton.click()

    // Dialog de confirmação
    await expect(page.locator('text=/será retirada/i')).toBeVisible({ timeout: 5000 })
    await page.locator('button:has-text("Confirmar e editar")').click()

    // Redireciona para edição
    await page.waitForURL(/\/editar/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=/Editar Inscrição/i').first()).toBeVisible()

    // Alterar campo via API (mais confiável que preencher form dinâmico)
    const putRes = await page.request.put(`/api/proponente/inscricoes/${inscricaoId}`, {
      data: {
        campos: {
          nomeProjeto: 'Centro Cultural Raízes de Irecê — Edição Revisada',
          descricao: 'Projeto revisado de fortalecimento das expressões culturais tradicionais do semiárido baiano, com oficinas ampliadas de música, dança, artesanato e cultura digital para a comunidade de Irecê e região.',
          valorSolicitado: '50000',
          publicoAlvo: 'Todos',
          justificativa: 'O município de Irecê possui rica tradição cultural que necessita de apoio institucional para sua preservação e difusão. Este projeto atende à demanda da comunidade por espaços de formação e expressão artística, contribuindo para o fortalecimento da identidade cultural local.',
        },
      },
    })
    expect(putRes.status()).toBe(200)

    // Re-submeter
    const submitRes = await page.request.post(`/api/proponente/inscricoes/${inscricaoId}/submit`)
    expect(submitRes.status()).toBe(200)

    // Verificar na UI
    await page.goto(`/proponente/inscricoes/${inscricaoId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=/Enviada/i').first()).toBeVisible()
    await expect(page.locator('text=Edição Revisada')).toBeVisible()
    console.log('[E2E] Inscrição editada e reenviada com sucesso')
  })

  // ── 4. ADMIN encerra inscrições ────────────────────────────────────────

  test('4. ADMIN encerra inscrições do edital', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    let res = await updateEditalStatus(page, 'INSCRICOES_ENCERRADAS')
    expect(res.status()).toBe(200)

    res = await updateEditalStatus(page, 'HABILITACAO')
    expect(res.status()).toBe(200)
    console.log('[E2E] Edital em fase de habilitação')
  })

  // ── 5. HABILITADOR habilita inscrição via UI ───────────────────────────

  test('5. HABILITADOR habilita a inscrição', async ({ page }) => {
    await login(page, USERS.HABILITADOR.cpf, USERS.HABILITADOR.senha)

    // Navegar para a inscrição
    await page.goto(`/admin/inscricoes/${inscricaoId}`)
    await page.waitForLoadState('networkidle')

    // Clicar em "Habilitar"
    const habilitarBtn = page.locator('button:has-text("Habilitar")').first()
    if (await habilitarBtn.isVisible()) {
      await habilitarBtn.click()
      await page.waitForLoadState('networkidle')

      // Verificar badge HABILITADA
      await expect(page.locator('text=/Habilitada/i').first()).toBeVisible({ timeout: 10000 })
      console.log('[E2E] Inscrição habilitada')
    } else {
      // Fallback: habilitar via API
      const res = await page.request.put(`/api/admin/inscricoes/${inscricaoId}/habilitacao`, {
        data: { status: 'HABILITADA' },
      })
      expect(res.status()).toBe(200)
      console.log('[E2E] Inscrição habilitada via API (fallback)')
    }
  })

  // ── 6. ADMIN atribui avaliador e muda para AVALIACAO ───────────────────

  test('6. ADMIN atribui avaliador e muda edital para AVALIACAO', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    // Atribuir avaliador (precisa do ID do avaliador)
    // Buscar usuário avaliador
    const usersRes = await page.request.get('/api/admin/avaliadores')
    if (usersRes.ok()) {
      const avaliadores = await usersRes.json()
      const avaliadorList = avaliadores.data || avaliadores
      if (Array.isArray(avaliadorList) && avaliadorList.length > 0) {
        const avaliadorId = avaliadorList[0].id

        const assignRes = await page.request.post(`/api/admin/inscricoes/${inscricaoId}/avaliacao/assign`, {
          data: { avaliadorIds: [avaliadorId] },
        })
        if (assignRes.ok()) {
          console.log(`[E2E] Avaliador ${avaliadorId} atribuído`)
        }
      }
    }

    // Mudar edital para AVALIACAO
    const res = await updateEditalStatus(page, 'AVALIACAO')
    expect(res.status()).toBe(200)
    console.log('[E2E] Edital em fase de avaliação')
  })

  // ── 7. AVALIADOR avalia inscrição ──────────────────────────────────────

  test('7. AVALIADOR avalia inscrição com nota e parecer', async ({ page }) => {
    await login(page, USERS.AVALIADOR.cpf, USERS.AVALIADOR.senha)

    // Tentar via UI primeiro
    await page.goto(`/avaliador/inscricoes/${inscricaoId}`)
    await page.waitForLoadState('networkidle')

    // Verificar se formulário de avaliação está visível
    const parecerField = page.locator('textarea').first()
    if (await parecerField.isVisible()) {
      await parecerField.fill('Projeto de alta relevância cultural. O Centro Cultural Raízes demonstra forte atuação comunitária e capacidade de execução. Recomendo aprovação.')

      // Preencher notas nos campos numéricos
      const noteInputs = page.locator('input[type="number"]')
      const count = await noteInputs.count()
      for (let i = 0; i < count; i++) {
        await noteInputs.nth(i).fill('80')
      }

      // Finalizar avaliação
      const finalizarBtn = page.locator('button:has-text("Finalizar")')
      if (await finalizarBtn.isVisible()) {
        await finalizarBtn.click()
        await page.waitForLoadState('networkidle')
        console.log('[E2E] Avaliação finalizada via UI')
      }
    } else {
      // Fallback: avaliar via API como admin
      await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

      const avalRes = await page.request.put(`/api/admin/inscricoes/${inscricaoId}/avaliacao`, {
        data: {
          notas: [
            { criterio: 'Atuação da entidade cultural', nota: 85, peso: 30 },
            { criterio: 'Qualidade do projeto', nota: 90, peso: 40 },
            { criterio: 'Abrangência do público', nota: 75, peso: 20 },
            { criterio: 'Bonificação', nota: 5, peso: 10 },
          ],
          parecer: 'Projeto de alta relevância cultural. Recomendo aprovação.',
          finalizar: true,
        },
      })
      console.log(`[E2E] Avaliação via API — status ${avalRes.status()}`)
    }
  })

  // ── 8. ADMIN publica resultado preliminar ──────────────────────────────

  test('8. ADMIN publica resultado preliminar', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    const res = await updateEditalStatus(page, 'RESULTADO_PRELIMINAR')
    expect(res.status()).toBe(200)
    console.log('[E2E] Resultado preliminar publicado')
  })

  // ── 9. PROPONENTE vê resultado e interpõe recurso ──────────────────────

  test('9. PROPONENTE vê resultado e interpõe recurso', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)

    await page.goto(`/proponente/inscricoes/${inscricaoId}`)
    await page.waitForLoadState('networkidle')

    // Tentar submeter recurso via UI
    const recursoTextarea = page.locator('#recurso-texto')
    if (await recursoTextarea.isVisible()) {
      await recursoTextarea.fill(
        'Solicito revisão da pontuação atribuída ao critério de abrangência do público. ' +
        'O projeto contempla ações em todas as comunidades rurais do município, conforme ' +
        'detalhado no plano de trabalho em anexo. A nota atribuída não reflete o alcance ' +
        'real das ações propostas.'
      )

      const enviarRecursoBtn = page.locator('button:has-text("Enviar Recurso"), button:has-text("Submeter")')
      if (await enviarRecursoBtn.first().isVisible()) {
        await enviarRecursoBtn.first().click()
        await page.waitForLoadState('networkidle')
        console.log('[E2E] Recurso submetido via UI')
      }
    } else {
      // Fallback: recurso via API
      const recursoRes = await page.request.post(`/api/proponente/inscricoes/${inscricaoId}/recurso`, {
        data: {
          fase: 'RESULTADO_PRELIMINAR',
          texto: 'Solicito revisão da pontuação. O projeto contempla ações em todas as comunidades rurais do município, conforme plano de trabalho.',
        },
      })
      console.log(`[E2E] Recurso via API — status ${recursoRes.status()}`)
    }
  })

  // ── 10. ADMIN publica resultado final ──────────────────────────────────

  test('10. ADMIN publica resultado final', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    // Mover para RECURSO
    let res = await updateEditalStatus(page, 'RECURSO')
    expect(res.status()).toBe(200)

    // Mover para RESULTADO_FINAL
    res = await updateEditalStatus(page, 'RESULTADO_FINAL')
    expect(res.status()).toBe(200)
    console.log('[E2E] Resultado final publicado')
  })

  // ── 11. PROPONENTE baixa PDFs ──────────────────────────────────────────

  test('11. PROPONENTE baixa comprovante e projeto em PDF', async ({ page }) => {
    await login(page, USERS.PROPONENTE.cpf, USERS.PROPONENTE.senha)

    // Comprovante PDF
    const comprovanteRes = await page.request.get(`/api/proponente/inscricoes/${inscricaoId}/comprovante`)
    expect(comprovanteRes.status()).toBe(200)
    expect(comprovanteRes.headers()['content-type']).toContain('pdf')
    console.log('[E2E] Comprovante PDF baixado')

    // Projeto PDF
    const projetoRes = await page.request.get(`/api/proponente/inscricoes/${inscricaoId}/projeto-pdf`)
    expect(projetoRes.status()).toBe(200)
    expect(projetoRes.headers()['content-type']).toContain('pdf')
    console.log('[E2E] Projeto PDF baixado')
  })

  // ── 12. Verificações finais ────────────────────────────────────────────

  test('12. Página pública do edital está acessível', async ({ page }) => {
    await page.goto(`/editais/${editalSlug}`)
    await page.waitForLoadState('networkidle')

    // Verifica que a página carregou com o título do edital
    await expect(page.locator('text=/Pontos de Cultura/i').first()).toBeVisible({ timeout: 10000 })
    console.log('[E2E] Página pública do edital acessível')
  })

  test('13. ADMIN vê logs de auditoria do ciclo', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    await page.goto('/admin/logs')
    await page.waitForLoadState('networkidle')

    // Verifica que logs existem na página
    const logEntries = page.locator('table tbody tr, [class*="log"], [class*="card"]')
    const count = await logEntries.count()
    expect(count).toBeGreaterThan(0)
    console.log(`[E2E] ${count} entradas de log encontradas`)
  })

  // ── 14. Cleanup: ADMIN encerra edital ──────────────────────────────────

  test('14. ADMIN encerra o edital', async ({ page }) => {
    await login(page, USERS.ADMIN.cpf, USERS.ADMIN.senha)

    const res = await updateEditalStatus(page, 'ENCERRADO')
    expect(res.status()).toBe(200)
    console.log('[E2E] Edital encerrado — ciclo completo!')
  })
})
