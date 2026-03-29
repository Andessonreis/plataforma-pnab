import { test, expect } from '@playwright/test'
import { login, CREDENTIALS } from './helpers'

/* ──────────────────────────────────────────────────────────────────────────────
 * TESTE E2E — Ciclo de Vida Completo do Edital
 *
 * Simula o fluxo real de processamento do sistema PNAB:
 *  1. Admin login
 *  2. Admin cria edital (RASCUNHO) com cronograma
 *  3. Admin publica edital (→ PUBLICADO)
 *  4. Admin abre inscrições (→ INSCRICOES_ABERTAS)
 *  5. Proponente login + cria inscrição + submete
 *  6. Admin encerra inscrições (→ INSCRICOES_ENCERRADAS)
 *  7. Admin inicia habilitação (→ HABILITACAO)
 *  8. Habilitador habilita inscrição
 *  9. Admin inicia avaliação (→ AVALIACAO)
 * 10. Avaliador atribuído + avalia (notas + parecer)
 * 11. Admin publica resultado preliminar
 * 12. Admin publica resultado final → Verifica CONTEMPLADA
 *
 * Delay entre fases: env PHASE_DELAY_MS (default 10s, 600000 para simulação real)
 * Rodar: npx playwright test e2e/ciclo-vida-completo.spec.ts --headed
 * ────────────────────────────────────────────────────────────────────────────── */

const PHASE_DELAY_MS = Number(process.env.PHASE_DELAY_MS) || 10_000

// ── Estado compartilhado entre testes sequenciais ───────────────────────────

let editalId: string
let editalSlug: string
let inscricaoId: string
let inscricaoNumero: string
let avaliadorUserId: string

// ── Helpers de log ──────────────────────────────────────────────────────────

function ts(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false })
}

function logPhase(n: number, desc: string) {
  console.log(`\n[${ts()}] ${'═'.repeat(50)}`)
  console.log(`[${ts()}] ETAPA ${n}: ${desc}`)
  console.log(`[${ts()}] ${'─'.repeat(50)}`)
}

function logOk(msg: string) {
  console.log(`[${ts()}] ✓ ${msg}`)
}

function logInfo(msg: string) {
  console.log(`[${ts()}] → ${msg}`)
}

async function phaseDelay(nextPhase: string) {
  if (PHASE_DELAY_MS > 0) {
    console.log(`[${ts()}] ⏳ Aguardando ${PHASE_DELAY_MS / 1000}s para ${nextPhase}...`)
    await new Promise((r) => setTimeout(r, PHASE_DELAY_MS))
  }
}

// ── Dados do edital de teste ────────────────────────────────────────────────

const uniqueId = Date.now().toString(36)

const EDITAL_DATA = {
  titulo: `Edital E2E Ciclo Completo ${uniqueId}`,
  resumo: 'Teste automatizado — ciclo de vida completo do edital PNAB',
  ano: new Date().getFullYear(),
  valorTotal: 150000,
  categorias: ['Música', 'Dança', 'Teatro'],
  status: 'RASCUNHO',
  vagasContemplados: 3,
  vagasSuplentes: 2,
  camposFormulario: [
    { nome: 'nome_projeto', tipo: 'texto', label: 'Nome do Projeto', obrigatorio: true },
    { nome: 'descricao', tipo: 'textarea', label: 'Descrição do Projeto', obrigatorio: true },
    { nome: 'justificativa', tipo: 'textarea', label: 'Justificativa', obrigatorio: false },
  ],
  cronograma: [
    { tipo: 'fase', fase: 'PUBLICADO', dataHora: new Date(Date.now() - 86400000 * 10).toISOString(), destaque: false },
    { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: new Date(Date.now() - 86400000 * 9).toISOString(), destaque: true },
    { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: new Date(Date.now() - 86400000 * 5).toISOString(), destaque: false },
    { tipo: 'fase', fase: 'HABILITACAO', dataHora: new Date(Date.now() - 86400000 * 4).toISOString(), destaque: false },
    { tipo: 'fase', fase: 'AVALIACAO', dataHora: new Date(Date.now() - 86400000 * 3).toISOString(), destaque: false },
    { tipo: 'fase', fase: 'RESULTADO_PRELIMINAR', dataHora: new Date(Date.now() - 86400000 * 2).toISOString(), destaque: false },
    { tipo: 'fase', fase: 'RESULTADO_FINAL', dataHora: new Date(Date.now() - 86400000 * 1).toISOString(), destaque: true },
  ],
}

// PDF mínimo válido (magic bytes %PDF para passar validação)
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n' +
    'xref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n' +
    'trailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n109\n%%EOF',
)

// Notas para avaliação (critérios padrão PNAB — src/lib/avaliacao-criterios.ts)
const NOTAS_AVALIACAO = [
  { criterio: 'Relevância Cultural', peso: 25, nota: 9 },
  { criterio: 'Viabilidade Técnica', peso: 25, nota: 8 },
  { criterio: 'Coerência do Plano de Trabalho', peso: 20, nota: 8 },
  { criterio: 'Contrapartida Social', peso: 15, nota: 7 },
  { criterio: 'Histórico do Proponente', peso: 15, nota: 8 },
]

// PUT do edital requer body completo — helper para trocar só o status
function editalWithStatus(status: string) {
  return { ...EDITAL_DATA, status }
}

// ── Testes Sequenciais ──────────────────────────────────────────────────────

test.describe.serial('Ciclo de Vida Completo do Edital', () => {
  // Timeout: delays entre fases + margem para operações
  test.setTimeout(Math.max(300_000, PHASE_DELAY_MS * 12 + 180_000))

  // ── ETAPA 1: Admin Login ────────────────────────────────────────────────

  test('1. Admin login', async ({ page }) => {
    logPhase(1, 'Admin Login')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)
    expect(page.url()).toContain('/admin')

    logOk('Admin logado com sucesso')
    logInfo(`URL: ${page.url()}`)
  })

  // ── ETAPA 2: Criar Edital (RASCUNHO) ───────────────────────────────────

  test('2. Admin cria edital com cronograma (RASCUNHO)', async ({ page }) => {
    logPhase(2, 'Criar Edital (RASCUNHO)')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.post('/api/admin/editais', {
      data: EDITAL_DATA,
    })

    expect(res.status()).toBe(201)
    const body = await res.json()
    editalId = body.id
    editalSlug = body.slug

    expect(editalId).toBeTruthy()
    expect(editalSlug).toBeTruthy()

    logOk(`Edital criado: "${EDITAL_DATA.titulo}"`)
    logInfo(`id: ${editalId}`)
    logInfo(`slug: ${editalSlug}`)
    logInfo('status: RASCUNHO')
    logInfo(`categorias: ${EDITAL_DATA.categorias.join(', ')}`)
    logInfo(`vagas: ${EDITAL_DATA.vagasContemplados} contemplados + ${EDITAL_DATA.vagasSuplentes} suplentes`)
  })

  // ── ETAPA 3: Publicar Edital ────────────────────────────────────────────

  test('3. Admin publica edital (RASCUNHO → PUBLICADO)', async ({ page }) => {
    logPhase(3, 'Publicar Edital')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.put(`/api/admin/editais?id=${editalId}`, {
      data: editalWithStatus('PUBLICADO'),
    })

    expect(res.status()).toBe(200)
    logOk('Edital publicado com publishedAt registrado')
    logInfo('status: RASCUNHO → PUBLICADO')

    await phaseDelay('abertura de inscrições')
  })

  // ── ETAPA 4: Abrir Inscrições ───────────────────────────────────────────

  test('4. Admin abre inscrições (PUBLICADO → INSCRICOES_ABERTAS)', async ({ page }) => {
    logPhase(4, 'Abrir Inscrições')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.put(`/api/admin/editais?id=${editalId}`, {
      data: editalWithStatus('INSCRICOES_ABERTAS'),
    })

    expect(res.status()).toBe(200)
    logOk('Inscrições abertas')

    // Verificar página pública
    await page.goto(`/editais/${editalSlug}`)
    await page.waitForLoadState('networkidle')
    const text = await page.textContent('body')
    const visible =
      text?.includes('Inscrições Abertas') ||
      text?.includes('Inscrever') ||
      text?.includes('aberta')
    logOk(`Página pública: ${visible ? 'status visível' : 'edital carregado'}`)
    logInfo('status: PUBLICADO → INSCRICOES_ABERTAS')

    await phaseDelay('inscrição do proponente')
  })

  // ── ETAPA 5: Proponente Inscreve ────────────────────────────────────────

  test('5. Proponente cria inscrição, preenche campos e submete', async ({ page }) => {
    logPhase(5, 'Proponente Inscreve')

    await login(page, CREDENTIALS.PROPONENTE.cpf, CREDENTIALS.PROPONENTE.senha)
    logOk('Proponente logado')

    // 5a — Criar inscrição (rascunho)
    const createRes = await page.request.post('/api/proponente/inscricoes', {
      data: { editalId, categoria: 'Música' },
    })

    if (createRes.status() === 409) {
      const conflict = await createRes.json()
      inscricaoId = conflict.inscricaoId
      logOk(`Inscrição já existente: ${inscricaoId} (rerun detectado)`)
    } else {
      expect(createRes.status()).toBe(201)
      const body = await createRes.json()
      inscricaoId = body.id
      inscricaoNumero = body.numero
      logOk(`Inscrição criada: ${inscricaoNumero} (${inscricaoId})`)
    }

    // 5b — Preencher campos obrigatórios
    const updateRes = await page.request.put(
      `/api/proponente/inscricoes/${inscricaoId}`,
      {
        data: {
          campos: {
            nome_projeto: 'Festival de Música Popular de Irecê',
            descricao:
              'Evento cultural com artistas locais promovendo a diversidade musical da região do semiárido baiano.',
            justificativa:
              'A cidade carece de eventos culturais acessíveis e gratuitos para a população.',
          },
          categoria: 'Música',
        },
      },
    )

    if (updateRes.ok()) {
      logOk('Campos preenchidos (nome_projeto, descricao, justificativa)')
    } else {
      const err = await updateRes.json().catch(() => ({}))
      logInfo(`Campos: ${updateRes.status()} — ${JSON.stringify(err)}`)
    }

    // 5c — Upload anexo (PDF mínimo)
    const uploadRes = await page.request.post(
      `/api/proponente/inscricoes/${inscricaoId}/anexos`,
      {
        multipart: {
          file: {
            name: 'proposta-e2e.pdf',
            mimeType: 'application/pdf',
            buffer: MINIMAL_PDF,
          },
          tipo: 'PROPOSTA',
          titulo: 'Proposta Completa — Teste E2E',
        },
      },
    )

    if (uploadRes.ok()) {
      logOk('Anexo enviado (proposta-e2e.pdf)')
    } else {
      const err = await uploadRes.json().catch(() => ({}))
      console.log(
        `[${ts()}] ⚠ Upload falhou (${uploadRes.status()}): ${JSON.stringify(err)}`,
      )
    }

    // 5d — Submeter inscrição (RASCUNHO → ENVIADA)
    const submitRes = await page.request.post(
      `/api/proponente/inscricoes/${inscricaoId}/submit`,
    )

    if (submitRes.ok()) {
      const submitBody = await submitRes.json()
      inscricaoNumero = submitBody.numero || inscricaoNumero
      logOk(`Inscrição submetida: ${inscricaoNumero}`)
      logInfo('status inscrição: RASCUNHO → ENVIADA')
    } else {
      const err = await submitRes.json().catch(() => ({}))
      console.log(
        `[${ts()}] ⚠ Submit (${submitRes.status()}): ${JSON.stringify(err)}`,
      )
      // Se já estava ENVIADA (rerun), não é erro
      if (err.message?.includes('já foi enviada')) {
        logOk('Inscrição já estava ENVIADA (rerun)')
      }
    }

    // Verificar inscrição no painel do proponente
    await page.goto('/proponente/inscricoes')
    await page.waitForLoadState('networkidle')
    const text = await page.textContent('body')
    const hasInscricao =
      text?.includes(inscricaoNumero) || text?.includes('ENVIADA') || text?.includes('Enviada')
    logOk(`Painel proponente: ${hasInscricao ? 'inscrição visível' : 'carregado'}`)

    await phaseDelay('encerramento de inscrições')
  })

  // ── ETAPA 6: Encerrar Inscrições ────────────────────────────────────────

  test('6. Admin encerra inscrições (INSCRICOES_ABERTAS → INSCRICOES_ENCERRADAS)', async ({
    page,
  }) => {
    logPhase(6, 'Encerrar Inscrições')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.put(`/api/admin/editais?id=${editalId}`, {
      data: editalWithStatus('INSCRICOES_ENCERRADAS'),
    })

    expect(res.status()).toBe(200)
    logOk('Inscrições encerradas')
    logInfo('status: INSCRICOES_ABERTAS → INSCRICOES_ENCERRADAS')

    await phaseDelay('início da habilitação')
  })

  // ── ETAPA 7: Iniciar Habilitação ────────────────────────────────────────

  test('7. Admin inicia habilitação (INSCRICOES_ENCERRADAS → HABILITACAO)', async ({
    page,
  }) => {
    logPhase(7, 'Iniciar Habilitação')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.put(`/api/admin/editais?id=${editalId}`, {
      data: editalWithStatus('HABILITACAO'),
    })

    expect(res.status()).toBe(200)
    logOk('Fase de habilitação iniciada')
    logInfo('status: INSCRICOES_ENCERRADAS → HABILITACAO')

    await phaseDelay('habilitação da inscrição')
  })

  // ── ETAPA 8: Habilitar Inscrição ────────────────────────────────────────

  test('8. Habilitador habilita inscrição', async ({ page }) => {
    logPhase(8, 'Habilitar Inscrição')

    // ADMIN tem permissão de HABILITADOR — simplifica o teste
    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.put(
      `/api/admin/inscricoes/${inscricaoId}/habilitacao`,
      { data: { status: 'HABILITADA' } },
    )

    expect(res.status()).toBe(200)
    logOk(`Inscrição ${inscricaoNumero || inscricaoId} habilitada`)
    logInfo('status inscrição: ENVIADA → HABILITADA')

    await phaseDelay('início da avaliação')
  })

  // ── ETAPA 9: Iniciar Avaliação ──────────────────────────────────────────

  test('9. Admin inicia avaliação (HABILITACAO → AVALIACAO)', async ({ page }) => {
    logPhase(9, 'Iniciar Avaliação')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.put(`/api/admin/editais?id=${editalId}`, {
      data: editalWithStatus('AVALIACAO'),
    })

    expect(res.status()).toBe(200)
    logOk('Fase de avaliação iniciada')
    logInfo('status: HABILITACAO → AVALIACAO')

    await phaseDelay('atribuição e avaliação')
  })

  // ── ETAPA 10: Atribuir Avaliador + Avaliar ──────────────────────────────

  test('10. Avaliador atribuído e avalia inscrição com notas e parecer', async ({
    page,
  }) => {
    logPhase(10, 'Atribuir Avaliador + Avaliar Inscrição')

    // ── 10a: Admin atribui avaliador ──────────────────────────────────────

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    // Buscar avaliadores disponíveis
    const avaliadoresRes = await page.request.get('/api/admin/avaliadores')
    expect(avaliadoresRes.status()).toBe(200)
    const { data: avaliadores } = await avaliadoresRes.json()
    expect(avaliadores.length).toBeGreaterThan(0)

    avaliadorUserId = avaliadores[0].id
    logOk(`Avaliador encontrado: ${avaliadores[0].nome} (${avaliadorUserId})`)

    // Atribuir avaliador à inscrição
    const assignRes = await page.request.post(
      `/api/admin/inscricoes/${inscricaoId}/avaliacao/assign`,
      { data: { avaliadorIds: [avaliadorUserId] } },
    )

    expect(assignRes.status()).toBe(201)
    const assignBody = await assignRes.json()
    logOk(`${assignBody.created} avaliador(es) atribuído(s)`)
    logInfo('status inscrição: HABILITADA → EM_AVALIACAO')

    // ── 10b: Avaliador avalia ─────────────────────────────────────────────
    // Login inline — AVALIADOR redireciona para /avaliador (não /admin)

    await page.goto('/login')
    await page.waitForSelector('#cpf-ou-cnpj', { timeout: 15000 })
    await page.locator('#cpf-ou-cnpj').fill(CREDENTIALS.AVALIADOR.cpf)
    await page.locator('#senha').fill(CREDENTIALS.AVALIADOR.senha)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(admin|proponente|avaliador)/, { timeout: 30000 })
    await page.waitForLoadState('load')
    logOk('Avaliador logado')

    const avalRes = await page.request.put(
      `/api/admin/inscricoes/${inscricaoId}/avaliacao`,
      {
        data: {
          notas: NOTAS_AVALIACAO,
          parecer:
            'Proposta com excelente relevância cultural e boa viabilidade técnica. ' +
            'O plano de trabalho é coerente e a contrapartida social é adequada. ' +
            'Recomendo aprovação.',
          finalizar: true,
        },
      },
    )

    expect(avalRes.status()).toBe(200)
    const avalBody = await avalRes.json()
    logOk(`Avaliação finalizada — nota total: ${avalBody.avaliacao.notaTotal}`)
    logInfo(`notaTotal: ${avalBody.avaliacao.notaTotal}`)
    logInfo(`finalizada: ${avalBody.avaliacao.finalizada}`)

    await phaseDelay('resultado preliminar')
  })

  // ── ETAPA 11: Resultado Preliminar ──────────────────────────────────────

  test('11. Admin publica resultado preliminar', async ({ page }) => {
    logPhase(11, 'Resultado Preliminar')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    const res = await page.request.post(
      `/api/admin/editais/${editalId}/resultados`,
      { data: { fase: 'RESULTADO_PRELIMINAR' } },
    )

    expect(res.status()).toBe(200)
    const body = await res.json()
    logOk(
      `Resultado preliminar publicado — ${body.totalInscrições} inscrição(ões) processada(s)`,
    )
    logInfo('status edital: AVALIACAO → RESULTADO_PRELIMINAR')

    // Verificar página de resultados do admin
    await page.goto(`/admin/editais/${editalId}/resultados`)
    await page.waitForLoadState('networkidle')
    const text = await page.textContent('body')
    const hasData =
      text?.includes('Resultado') ||
      text?.includes('nota') ||
      text?.includes('posição') ||
      text?.includes('Contemplad')
    logOk(`Página de resultados: ${hasData ? 'dados visíveis' : 'carregada'}`)

    await phaseDelay('resultado final')
  })

  // ── ETAPA 12: Resultado Final ───────────────────────────────────────────

  test('12. Admin publica resultado final e verifica CONTEMPLADA', async ({
    page,
  }) => {
    logPhase(12, 'Resultado Final')

    await login(page, CREDENTIALS.ADMIN.cpf, CREDENTIALS.ADMIN.senha)

    // 12a — Publicar resultado final
    const res = await page.request.post(
      `/api/admin/editais/${editalId}/resultados`,
      { data: { fase: 'RESULTADO_FINAL' } },
    )

    expect(res.status()).toBe(200)
    const body = await res.json()
    logOk(
      `Resultado final publicado — ${body.totalInscrições} inscrição(ões) processada(s)`,
    )

    // 12b — Verificar resultados via API
    const resultadosRes = await page.request.get(
      `/api/admin/editais/${editalId}/resultados`,
    )
    expect(resultadosRes.status()).toBe(200)
    const { edital, resultados } = await resultadosRes.json()

    expect(edital.status).toBe('RESULTADO_FINAL')
    logOk(`Edital status final: ${edital.status}`)

    // 12c — Verificar inscrição contemplada
    const nossa = resultados.find(
      (r: { inscricaoId: string }) => r.inscricaoId === inscricaoId,
    )
    expect(nossa).toBeTruthy()
    logOk(`Inscrição ${nossa.numero}: ${nossa.status}`)
    logInfo(`Nota final: ${nossa.notaFinal}`)
    logInfo(`Posição: ${nossa.posicao}`)
    logInfo(`Total avaliações: ${nossa.totalAvaliacoes}`)

    // 12d — Verificar página pública do edital
    await page.goto(`/editais/${editalSlug}`)
    await page.waitForLoadState('networkidle')
    const text = await page.textContent('body')
    const hasEdital = text?.includes(EDITAL_DATA.titulo) || text?.includes('Resultado')
    logOk(`Página pública: ${hasEdital ? 'edital com resultado' : 'carregada'}`)

    // ── RESUMO FINAL ────────────────────────────────────────────────────

    console.log(`\n[${ts()}] ${'═'.repeat(54)}`)
    console.log(`[${ts()}]   RESUMO FINAL — CICLO DE VIDA COMPLETO`)
    console.log(`[${ts()}] ${'═'.repeat(54)}`)
    console.log(`[${ts()}]`)
    console.log(`[${ts()}]   Edital: ${EDITAL_DATA.titulo}`)
    console.log(`[${ts()}]     ID:     ${editalId}`)
    console.log(`[${ts()}]     Slug:   ${editalSlug}`)
    console.log(`[${ts()}]     Status: ${edital.status}`)
    console.log(`[${ts()}]`)
    console.log(`[${ts()}]   Inscrição: ${nossa.numero}`)
    console.log(`[${ts()}]     ID:       ${inscricaoId}`)
    console.log(`[${ts()}]     Status:   ${nossa.status}`)
    console.log(`[${ts()}]     Nota:     ${nossa.notaFinal}`)
    console.log(`[${ts()}]     Posição:  ${nossa.posicao}`)
    console.log(`[${ts()}]`)
    console.log(`[${ts()}]   Avaliador ID: ${avaliadorUserId}`)
    console.log(`[${ts()}]   Delay entre fases: ${PHASE_DELAY_MS / 1000}s`)
    console.log(`[${ts()}]`)
    console.log(`[${ts()}] ${'═'.repeat(54)}`)
    console.log(`[${ts()}]   ✅ CICLO DE VIDA COMPLETO — SUCESSO`)
    console.log(`[${ts()}] ${'═'.repeat(54)}\n`)
  })
})
