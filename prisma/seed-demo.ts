/**
 * seed-demo.ts — Dados realistas de demonstração para apresentação
 *
 * Uso em produção:
 *   docker compose exec app npx tsx prisma/seed-demo.ts
 *
 * Idempotente: pode rodar várias vezes sem duplicar dados.
 * Migra editais do seed principal (seed.ts) para slugs/anos novos e adiciona
 * inscrições, avaliações, recursos, projetos apoiados e PDFs reais.
 */

import { PrismaClient, UserRole } from '@prisma/client'
import type { EditalStatus, InscricaoStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────────────────
// PDFs reais (fontes públicas da PNAB)
// ─────────────────────────────────────────────────────────────────────────────

const PDF = {
  editalPNAB: 'https://procede.api.br/uploads/editais/EDITAL_PNAB_2025_1.pdf',
  editalFomento: 'https://wanderley.ba.gov.br/wp-content/uploads/2024/07/EDITAL-DE-FOMENTO.pdf',
  editalPremiacao: 'https://wanderley.ba.gov.br/wp-content/uploads/2024/07/EDITAL-DE-PREMIACAO.pdf',
  planoTrabalho: 'https://www.gov.br/cultura/pt-br/assuntos/pnab/Plano-de-Trabalho.pdf',
  declaracoes: 'https://www.gov.br/cultura/pt-br/assuntos/pnab/Declaracoes.pdf',
  formularioRecurso: 'https://www.gov.br/cultura/pt-br/assuntos/pnab/Formulario-de-Recurso.pdf',
  guiaPNAB: 'https://www.gov.br/cultura/pt-br/assuntos/pnab/Guia-pratico-PNAB.pdf',
}

// ─────────────────────────────────────────────────────────────────────────────
// Critérios de avaliação padrão
// ─────────────────────────────────────────────────────────────────────────────

const CRITERIOS_AVALIACAO = [
  { criterio: 'Qualidade artística do projeto', peso: 3, notaMax: 10 },
  { criterio: 'Viabilidade técnica e orçamentária', peso: 2, notaMax: 10 },
  { criterio: 'Relevância cultural e social', peso: 3, notaMax: 10 },
  { criterio: 'Currículo e experiência do proponente', peso: 1, notaMax: 10 },
  { criterio: 'Contrapartida social', peso: 1, notaMax: 10 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Campos de formulário padrão
// ─────────────────────────────────────────────────────────────────────────────

const CAMPOS_FORMULARIO = [
  { nome: 'nomeProjeto', label: 'Nome do projeto', tipo: 'text', obrigatorio: true },
  { nome: 'descricao', label: 'Descrição do projeto', tipo: 'textarea', obrigatorio: true },
  { nome: 'valorSolicitado', label: 'Valor solicitado (R$)', tipo: 'number', obrigatorio: true },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fase(f: EditalStatus, dataHora: string) {
  return { tipo: 'fase' as const, fase: f, dataHora }
}

/** Calcula nota ponderada a partir de notas por critério */
function calcNotaTotal(notas: Array<{ nota: number; peso: number }>): number {
  const somaNotas = notas.reduce((acc, n) => acc + n.nota * n.peso, 0)
  const somaPesos = notas.reduce((acc, n) => acc + n.peso, 0)
  return Math.round((somaNotas / somaPesos) * 100) / 100
}

/**
 * Migra um edital de um slug antigo para um novo slug.
 * Limpa inscrições e arquivos associados ao edital antigo.
 */
async function migrateEditalSlug(oldSlug: string, newSlug: string) {
  // Se o novo slug já existe, não precisa migrar
  const existingNew = await prisma.edital.findUnique({ where: { slug: newSlug } })
  if (existingNew) return

  const old = await prisma.edital.findUnique({ where: { slug: oldSlug } })
  if (!old) return

  // Limpar dependências
  const inscricoes = await prisma.inscricao.findMany({ where: { editalId: old.id }, select: { id: true } })
  const inscIds = inscricoes.map((i) => i.id)
  if (inscIds.length > 0) {
    await prisma.projetoApoiado.deleteMany({ where: { inscricaoId: { in: inscIds } } })
    await prisma.recurso.deleteMany({ where: { inscricaoId: { in: inscIds } } })
    await prisma.avaliacao.deleteMany({ where: { inscricaoId: { in: inscIds } } })
    await prisma.anexoInscricao.deleteMany({ where: { inscricaoId: { in: inscIds } } })
    await prisma.inscricao.deleteMany({ where: { id: { in: inscIds } } })
  }
  await prisma.arquivoEdital.deleteMany({ where: { editalId: old.id } })
  await prisma.faqItem.deleteMany({ where: { editalId: old.id } })
  await prisma.edital.update({ where: { id: old.id }, data: { slug: newSlug } })
  console.log(`  Migrado slug: ${oldSlug} → ${newSlug}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎬 Seed Demo — Dados realistas para apresentação\n')

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. LIMPEZA — remover dados de teste/junk
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🧹 Limpeza...')

  // Remove editais com "teste" no título (e cascata associada)
  const editaisTeste = await prisma.edital.findMany({
    where: { titulo: { contains: 'teste', mode: 'insensitive' } },
    select: { id: true, titulo: true },
  })
  for (const e of editaisTeste) {
    // Limpar dependências em cascata manual
    const inscricoes = await prisma.inscricao.findMany({ where: { editalId: e.id }, select: { id: true } })
    const inscIds = inscricoes.map((i) => i.id)
    if (inscIds.length > 0) {
      await prisma.projetoApoiado.deleteMany({ where: { inscricaoId: { in: inscIds } } })
      await prisma.recurso.deleteMany({ where: { inscricaoId: { in: inscIds } } })
      await prisma.avaliacao.deleteMany({ where: { inscricaoId: { in: inscIds } } })
      await prisma.anexoInscricao.deleteMany({ where: { inscricaoId: { in: inscIds } } })
      await prisma.inscricao.deleteMany({ where: { id: { in: inscIds } } })
    }
    await prisma.arquivoEdital.deleteMany({ where: { editalId: e.id } })
    await prisma.faqItem.deleteMany({ where: { editalId: e.id } })
    await prisma.edital.delete({ where: { id: e.id } })
    console.log(`  Removido edital de teste: "${e.titulo}"`)
  }

  console.log(`  ${editaisTeste.length} edital(is) de teste removido(s)`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ATUALIZAR PROPONENTES com endereços reais de Irecê/BA
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📍 Atualizando endereços dos proponentes...')

  const enderecos: Array<{
    cpfCnpj: string
    cep: string
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
    complemento?: string
  }> = [
    { cpfCnpj: '12345678901', cep: '44900-000', logradouro: 'Rua Luiz Viana Filho', numero: '42', bairro: 'Centro', cidade: 'Irecê', uf: 'BA' },
    { cpfCnpj: '12345678000190', cep: '44900-000', logradouro: 'Praça Teotônio Marques Dourado', numero: '15', bairro: 'Centro', cidade: 'Irecê', uf: 'BA', complemento: 'Sala 3' },
    { cpfCnpj: '98765432100', cep: '44900-000', logradouro: 'Rua São Jorge', numero: '280', bairro: 'São José', cidade: 'Irecê', uf: 'BA' },
    { cpfCnpj: '11222333000155', cep: '44900-000', logradouro: 'Avenida Adolfo Oliveira', numero: '1200', bairro: 'Caixa d\'Água', cidade: 'Irecê', uf: 'BA', complemento: 'Galpão Cultural' },
    { cpfCnpj: '44555666000188', cep: '44900-000', logradouro: 'Rua José Zezinho da Silva', numero: '88', bairro: 'Bairro Alto', cidade: 'Irecê', uf: 'BA', complemento: 'Edifício Panorama, sala 201' },
    { cpfCnpj: '55667788900', cep: '44900-000', logradouro: 'Rua Castro Alves', numero: '156', bairro: 'Vila Esperança', cidade: 'Irecê', uf: 'BA' },
  ]

  for (const e of enderecos) {
    await prisma.user.updateMany({
      where: { cpfCnpj: e.cpfCnpj },
      data: {
        cep: e.cep,
        logradouro: e.logradouro,
        numero: e.numero,
        bairro: e.bairro,
        cidade: e.cidade,
        uf: e.uf,
        complemento: e.complemento ?? null,
      },
    })
  }

  console.log(`  ${enderecos.length} proponentes atualizados com endereço`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BUSCAR REFERÊNCIAS necessárias
  // ═══════════════════════════════════════════════════════════════════════════

  const proponentes = await prisma.user.findMany({
    where: { role: UserRole.PROPONENTE },
    orderBy: { createdAt: 'asc' },
  })
  const avaliador = await prisma.user.findFirst({
    where: { role: UserRole.AVALIADOR },
  })

  if (proponentes.length < 6) {
    throw new Error(`Esperava 6 proponentes, encontrou ${proponentes.length}. Rode o seed principal primeiro.`)
  }
  if (!avaliador) {
    throw new Error('Nenhum avaliador encontrado. Rode o seed principal primeiro.')
  }

  // Mapeamento por CPF/CNPJ para acesso fácil
  const prop = {
    carlos: proponentes.find((p) => p.cpfCnpj === '12345678901')!,
    sertaoVivo: proponentes.find((p) => p.cpfCnpj === '12345678000190')!,
    joana: proponentes.find((p) => p.cpfCnpj === '98765432100')!,
    coletivo: proponentes.find((p) => p.cpfCnpj === '11222333000155')!,
    producoes: proponentes.find((p) => p.cpfCnpj === '44555666000188')!,
    marcos: proponentes.find((p) => p.cpfCnpj === '55667788900')!,
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MIGRAÇÃO DE SLUGS — editais do seed original → novos slugs demo
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n🔄 Migrando slugs de editais existentes...')

  // 2025 → 2026 (editais que mudam de ano)
  await migrateEditalSlug('pnab-2025-fomento-artes', 'pnab-2026-fomento-artes')
  await migrateEditalSlug('pnab-2025-audiovisual', 'pnab-2026-audiovisual')
  await migrateEditalSlug('pnab-2025-patrimonio-cultural', 'pnab-2026-patrimonio')
  await migrateEditalSlug('pnab-2025-formacao-cultural', 'pnab-2026-formacao')
  // 2024 → 2025 (editais que mudam de ano)
  await migrateEditalSlug('pnab-2024-pontos-cultura', 'pnab-2025-pontos-cultura')
  await migrateEditalSlug('pnab-2024-fomento-cultura', 'pnab-2025-fomento-cultura')

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EDITAL 1 — INSCRICOES_ABERTAS
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📋 Criando/atualizando editais...')

  const edital1 = await prisma.edital.upsert({
    where: { slug: 'pnab-2026-fomento-artes' },
    update: {
      titulo: 'Edital PNAB 2026 — Fomento às Artes',
      status: 'INSCRICOES_ABERTAS',
      resumo: 'Edital de fomento à cultura para projetos artísticos no município de Irecê/BA. Contempla seis categorias com investimento total de R$ 600 mil, incluindo ações afirmativas com cotas de 30% para proponentes negros, indígenas e quilombolas.',
      valorTotal: 600000,
      categorias: ['Música', 'Dança', 'Teatro', 'Artes Visuais', 'Audiovisual', 'Literatura'],
      vagasContemplados: 12,
      vagasSuplentes: 4,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2026-03-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2026-04-30T23:59:59'),
        fase('HABILITACAO', '2026-05-15T00:00:00'),
        fase('AVALIACAO', '2026-06-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-07-01T00:00:00'),
        fase('RECURSO', '2026-07-10T00:00:00'),
        fase('RESULTADO_FINAL', '2026-08-01T00:00:00'),
        fase('ENCERRADO', '2026-08-31T23:59:59'),
      ],
    },
    create: {
      titulo: 'Edital PNAB 2026 — Fomento às Artes',
      slug: 'pnab-2026-fomento-artes',
      ano: 2026,
      status: 'INSCRICOES_ABERTAS',
      resumo: 'Edital de fomento à cultura para projetos artísticos no município de Irecê/BA. Contempla seis categorias com investimento total de R$ 600 mil, incluindo ações afirmativas com cotas de 30% para proponentes negros, indígenas e quilombolas.',
      valorTotal: 600000,
      categorias: ['Música', 'Dança', 'Teatro', 'Artes Visuais', 'Audiovisual', 'Literatura'],
      acoesAfirmativas: 'Cotas de 30% para proponentes negros, indígenas e quilombolas.\nCotas de 10% para pessoas com deficiência.\nBônus de pontuação para projetos realizados em comunidades rurais.',
      regrasElegibilidade: 'Proponentes com domicílio em Irecê/BA há pelo menos 2 anos.\nIdade mínima de 18 anos para pessoa física.\nCNPJ ativo há pelo menos 1 ano para pessoa jurídica.\nNão possuir pendências com a Secretaria de Cultura.',
      vagasContemplados: 12,
      vagasSuplentes: 4,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      publishedAt: new Date('2026-02-01T10:00:00'),
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2026-03-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2026-04-30T23:59:59'),
        fase('HABILITACAO', '2026-05-15T00:00:00'),
        fase('AVALIACAO', '2026-06-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-07-01T00:00:00'),
        fase('RECURSO', '2026-07-10T00:00:00'),
        fase('RESULTADO_FINAL', '2026-08-01T00:00:00'),
        fase('ENCERRADO', '2026-08-31T23:59:59'),
      ],
    },
  })
  console.log(`  ✔ Edital 1: ${edital1.titulo} [INSCRICOES_ABERTAS]`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EDITAL 2 — HABILITACAO (novo)
  // ═══════════════════════════════════════════════════════════════════════════

  const edital2 = await prisma.edital.upsert({
    where: { slug: 'pnab-2026-audiovisual' },
    update: {
      titulo: 'Edital de Audiovisual 2026 — Curtas e Documentários',
      status: 'HABILITACAO',
      resumo: 'Seleção pública para financiamento de curtas-metragens e documentários com temática cultural do sertão baiano. Até 8 projetos selecionados com valores entre R$ 20 mil e R$ 40 mil.',
      valorTotal: 250000,
      categorias: ['Curta-metragem', 'Documentário', 'Animação'],
      vagasContemplados: 8,
      vagasSuplentes: 3,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2026-01-15T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2026-02-28T23:59:59'),
        fase('HABILITACAO', '2026-03-10T00:00:00'),
        fase('AVALIACAO', '2026-04-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-05-01T00:00:00'),
        fase('RECURSO', '2026-05-10T00:00:00'),
        fase('RESULTADO_FINAL', '2026-06-01T00:00:00'),
        fase('ENCERRADO', '2026-06-30T23:59:59'),
      ],
    },
    create: {
      titulo: 'Edital de Audiovisual 2026 — Curtas e Documentários',
      slug: 'pnab-2026-audiovisual',
      ano: 2026,
      status: 'HABILITACAO',
      resumo: 'Seleção pública para financiamento de curtas-metragens e documentários com temática cultural do sertão baiano. Até 8 projetos selecionados com valores entre R$ 20 mil e R$ 40 mil.',
      valorTotal: 250000,
      categorias: ['Curta-metragem', 'Documentário', 'Animação'],
      acoesAfirmativas: 'Reserva de 25% das vagas para realizadores negros e indígenas.',
      regrasElegibilidade: 'Proponentes residentes no Território de Identidade de Irecê.\nExperiência comprovada em produção audiovisual.',
      vagasContemplados: 8,
      vagasSuplentes: 3,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      publishedAt: new Date('2026-01-10T10:00:00'),
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2026-01-15T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2026-02-28T23:59:59'),
        fase('HABILITACAO', '2026-03-10T00:00:00'),
        fase('AVALIACAO', '2026-04-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-05-01T00:00:00'),
        fase('RECURSO', '2026-05-10T00:00:00'),
        fase('RESULTADO_FINAL', '2026-06-01T00:00:00'),
        fase('ENCERRADO', '2026-06-30T23:59:59'),
      ],
    },
  })
  console.log(`  ✔ Edital 2: ${edital2.titulo} [HABILITACAO]`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EDITAL 3 — AVALIACAO (novo)
  // ═══════════════════════════════════════════════════════════════════════════

  const edital3 = await prisma.edital.upsert({
    where: { slug: 'pnab-2026-patrimonio' },
    update: {
      titulo: 'Edital de Patrimônio Cultural 2026',
      status: 'AVALIACAO',
      resumo: 'Chamamento público para projetos de preservação, documentação e valorização do patrimônio cultural material e imaterial de Irecê e região.',
      valorTotal: 180000,
      categorias: ['Patrimônio Material', 'Patrimônio Imaterial', 'Memória Oral'],
      vagasContemplados: 6,
      vagasSuplentes: 2,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-12-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2026-01-31T23:59:59'),
        fase('HABILITACAO', '2026-02-10T00:00:00'),
        fase('AVALIACAO', '2026-03-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-04-01T00:00:00'),
        fase('RECURSO', '2026-04-10T00:00:00'),
        fase('RESULTADO_FINAL', '2026-05-01T00:00:00'),
        fase('ENCERRADO', '2026-05-31T23:59:59'),
      ],
    },
    create: {
      titulo: 'Edital de Patrimônio Cultural 2026',
      slug: 'pnab-2026-patrimonio',
      ano: 2026,
      status: 'AVALIACAO',
      resumo: 'Chamamento público para projetos de preservação, documentação e valorização do patrimônio cultural material e imaterial de Irecê e região.',
      valorTotal: 180000,
      categorias: ['Patrimônio Material', 'Patrimônio Imaterial', 'Memória Oral'],
      acoesAfirmativas: 'Prioridade para projetos de comunidades quilombolas e indígenas.',
      regrasElegibilidade: 'Proponentes com domicílio em Irecê/BA.\nProjetos devem ter contrapartida social obrigatória.',
      vagasContemplados: 6,
      vagasSuplentes: 2,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      publishedAt: new Date('2025-11-20T10:00:00'),
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-12-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2026-01-31T23:59:59'),
        fase('HABILITACAO', '2026-02-10T00:00:00'),
        fase('AVALIACAO', '2026-03-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-04-01T00:00:00'),
        fase('RECURSO', '2026-04-10T00:00:00'),
        fase('RESULTADO_FINAL', '2026-05-01T00:00:00'),
        fase('ENCERRADO', '2026-05-31T23:59:59'),
      ],
    },
  })
  console.log(`  ✔ Edital 3: ${edital3.titulo} [AVALIACAO]`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EDITAL 4 — RESULTADO_PRELIMINAR (novo)
  // ═══════════════════════════════════════════════════════════════════════════

  const edital4 = await prisma.edital.upsert({
    where: { slug: 'pnab-2026-formacao' },
    update: {
      titulo: 'Edital de Formação Cultural 2026 — Oficinas e Workshops',
      status: 'RESULTADO_PRELIMINAR',
      resumo: 'Seleção de propostas de oficinas, workshops e cursos de formação artístico-cultural para a comunidade ireceense. Voltado para multiplicação de saberes.',
      valorTotal: 100000,
      categorias: ['Formação', 'Oficinas', 'Capacitação'],
      vagasContemplados: 10,
      vagasSuplentes: 3,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-10-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2025-11-30T23:59:59'),
        fase('HABILITACAO', '2025-12-10T00:00:00'),
        fase('AVALIACAO', '2026-01-10T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-02-15T00:00:00'),
        fase('RECURSO', '2026-02-25T00:00:00'),
        fase('RESULTADO_FINAL', '2026-03-15T00:00:00'),
        fase('ENCERRADO', '2026-04-30T23:59:59'),
      ],
    },
    create: {
      titulo: 'Edital de Formação Cultural 2026 — Oficinas e Workshops',
      slug: 'pnab-2026-formacao',
      ano: 2026,
      status: 'RESULTADO_PRELIMINAR',
      resumo: 'Seleção de propostas de oficinas, workshops e cursos de formação artístico-cultural para a comunidade ireceense. Voltado para multiplicação de saberes.',
      valorTotal: 100000,
      categorias: ['Formação', 'Oficinas', 'Capacitação'],
      acoesAfirmativas: 'Reserva de 30% para formadores de comunidades tradicionais.',
      regrasElegibilidade: 'Proponentes com experiência comprovada na área de formação proposta.\nProjetos devem atender no mínimo 20 participantes.',
      vagasContemplados: 10,
      vagasSuplentes: 3,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      publishedAt: new Date('2025-09-20T10:00:00'),
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-10-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2025-11-30T23:59:59'),
        fase('HABILITACAO', '2025-12-10T00:00:00'),
        fase('AVALIACAO', '2026-01-10T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2026-02-15T00:00:00'),
        fase('RECURSO', '2026-02-25T00:00:00'),
        fase('RESULTADO_FINAL', '2026-03-15T00:00:00'),
        fase('ENCERRADO', '2026-04-30T23:59:59'),
      ],
    },
  })
  console.log(`  ✔ Edital 4: ${edital4.titulo} [RESULTADO_PRELIMINAR]`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. EDITAL 5 — RESULTADO_FINAL (atualizar existente 2024→2025)
  // ═══════════════════════════════════════════════════════════════════════════

  const edital5 = await prisma.edital.upsert({
    where: { slug: 'pnab-2025-pontos-cultura' },
    update: {
      titulo: 'Pontos de Cultura 2025 — Rede Municipal',
      ano: 2025,
      status: 'RESULTADO_FINAL',
      resumo: 'Seleção de espaços culturais independentes para integrar a Rede Municipal de Pontos de Cultura de Irecê. Apoio de R$ 20 mil por ponto para manutenção e atividades culturais contínuas.',
      valorTotal: 120000,
      categorias: ['Pontos de Cultura', 'Espaços Culturais'],
      vagasContemplados: 6,
      vagasSuplentes: 0,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-05-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2025-06-30T23:59:59'),
        fase('HABILITACAO', '2025-07-15T00:00:00'),
        fase('AVALIACAO', '2025-08-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2025-09-01T00:00:00'),
        fase('RECURSO', '2025-09-10T00:00:00'),
        fase('RESULTADO_FINAL', '2025-10-01T00:00:00'),
        fase('ENCERRADO', '2025-12-31T23:59:59'),
      ],
    },
    create: {
      titulo: 'Pontos de Cultura 2025 — Rede Municipal',
      slug: 'pnab-2025-pontos-cultura',
      ano: 2025,
      status: 'RESULTADO_FINAL',
      resumo: 'Seleção de espaços culturais independentes para integrar a Rede Municipal de Pontos de Cultura de Irecê. Apoio de R$ 20 mil por ponto para manutenção e atividades culturais contínuas.',
      valorTotal: 120000,
      categorias: ['Pontos de Cultura', 'Espaços Culturais'],
      acoesAfirmativas: 'Prioridade para espaços em comunidades periféricas e rurais.',
      regrasElegibilidade: 'Espaços culturais em funcionamento há pelo menos 1 ano.\nComprovação de atividades culturais regulares.',
      vagasContemplados: 6,
      vagasSuplentes: 0,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      publishedAt: new Date('2025-04-20T10:00:00'),
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-05-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2025-06-30T23:59:59'),
        fase('HABILITACAO', '2025-07-15T00:00:00'),
        fase('AVALIACAO', '2025-08-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2025-09-01T00:00:00'),
        fase('RECURSO', '2025-09-10T00:00:00'),
        fase('RESULTADO_FINAL', '2025-10-01T00:00:00'),
        fase('ENCERRADO', '2025-12-31T23:59:59'),
      ],
    },
  })
  console.log(`  ✔ Edital 5: ${edital5.titulo} [RESULTADO_FINAL]`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. EDITAL 6 — ENCERRADO (atualizar existente 2024→2025)
  // ═══════════════════════════════════════════════════════════════════════════

  const edital6 = await prisma.edital.upsert({
    where: { slug: 'pnab-2025-fomento-cultura' },
    update: {
      titulo: 'Edital PNAB 2025 — Fomento à Cultura',
      ano: 2025,
      status: 'ENCERRADO',
      resumo: 'Primeiro grande edital PNAB de Irecê com seleção de 15 projetos culturais em diversas linguagens artísticas. Processo encerrado com sucesso — projetos em fase de execução.',
      valorTotal: 450000,
      categorias: ['Música', 'Dança', 'Teatro', 'Artesanato', 'Artes Visuais'],
      vagasContemplados: 15,
      vagasSuplentes: 5,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-03-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2025-04-30T23:59:59'),
        fase('HABILITACAO', '2025-05-15T00:00:00'),
        fase('AVALIACAO', '2025-06-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2025-07-01T00:00:00'),
        fase('RECURSO', '2025-07-10T00:00:00'),
        fase('RESULTADO_FINAL', '2025-08-01T00:00:00'),
        fase('ENCERRADO', '2025-09-30T23:59:59'),
      ],
    },
    create: {
      titulo: 'Edital PNAB 2025 — Fomento à Cultura',
      slug: 'pnab-2025-fomento-cultura',
      ano: 2025,
      status: 'ENCERRADO',
      resumo: 'Primeiro grande edital PNAB de Irecê com seleção de 15 projetos culturais em diversas linguagens artísticas. Processo encerrado com sucesso — projetos em fase de execução.',
      valorTotal: 450000,
      categorias: ['Música', 'Dança', 'Teatro', 'Artesanato', 'Artes Visuais'],
      acoesAfirmativas: 'Cotas de 20% para proponentes negros e indígenas.',
      regrasElegibilidade: 'Proponentes com domicílio em Irecê/BA há pelo menos 1 ano.',
      vagasContemplados: 15,
      vagasSuplentes: 5,
      criteriosAvaliacao: CRITERIOS_AVALIACAO,
      camposFormulario: CAMPOS_FORMULARIO,
      publishedAt: new Date('2025-02-20T10:00:00'),
      cronograma: [
        fase('INSCRICOES_ABERTAS', '2025-03-01T00:00:00'),
        fase('INSCRICOES_ENCERRADAS', '2025-04-30T23:59:59'),
        fase('HABILITACAO', '2025-05-15T00:00:00'),
        fase('AVALIACAO', '2025-06-01T00:00:00'),
        fase('RESULTADO_PRELIMINAR', '2025-07-01T00:00:00'),
        fase('RECURSO', '2025-07-10T00:00:00'),
        fase('RESULTADO_FINAL', '2025-08-01T00:00:00'),
        fase('ENCERRADO', '2025-09-30T23:59:59'),
      ],
    },
  })
  console.log(`  ✔ Edital 6: ${edital6.titulo} [ENCERRADO]`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. ARQUIVOS PDF dos editais
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📎 Criando arquivos PDF dos editais...')

  const allEditalIds = [edital1.id, edital2.id, edital3.id, edital4.id, edital5.id, edital6.id]
  await prisma.arquivoEdital.deleteMany({ where: { editalId: { in: allEditalIds } } })

  const arquivos = [
    // Edital 1 — Fomento Artes 2026
    { editalId: edital1.id, tipo: 'PDF', titulo: 'Edital Completo — Fomento às Artes 2026', url: PDF.editalPNAB, acessivel: true },
    { editalId: edital1.id, tipo: 'MODELO', titulo: 'Modelo de Plano de Trabalho', url: PDF.planoTrabalho, acessivel: false },
    { editalId: edital1.id, tipo: 'DECLARACAO', titulo: 'Declarações Obrigatórias', url: PDF.declaracoes, acessivel: false },
    // Edital 2 — Audiovisual 2026
    { editalId: edital2.id, tipo: 'PDF', titulo: 'Edital Audiovisual 2026 — Curtas e Documentários', url: PDF.editalFomento, acessivel: true },
    { editalId: edital2.id, tipo: 'MODELO', titulo: 'Modelo de Plano de Trabalho', url: PDF.planoTrabalho, acessivel: false },
    { editalId: edital2.id, tipo: 'DECLARACAO', titulo: 'Declarações Obrigatórias', url: PDF.declaracoes, acessivel: false },
    // Edital 3 — Patrimônio 2026
    { editalId: edital3.id, tipo: 'PDF', titulo: 'Edital de Patrimônio Cultural 2026', url: PDF.editalPremiacao, acessivel: true },
    { editalId: edital3.id, tipo: 'MODELO', titulo: 'Modelo de Plano de Trabalho', url: PDF.planoTrabalho, acessivel: false },
    // Edital 4 — Formação 2026
    { editalId: edital4.id, tipo: 'PDF', titulo: 'Edital de Formação Cultural 2026', url: PDF.editalFomento, acessivel: true },
    { editalId: edital4.id, tipo: 'MODELO', titulo: 'Modelo de Plano de Trabalho', url: PDF.planoTrabalho, acessivel: false },
    { editalId: edital4.id, tipo: 'ANEXO', titulo: 'Formulário de Recurso', url: PDF.formularioRecurso, acessivel: false },
    // Edital 5 — Pontos de Cultura 2025
    { editalId: edital5.id, tipo: 'PDF', titulo: 'Edital Pontos de Cultura 2025', url: PDF.editalPNAB, acessivel: true },
    { editalId: edital5.id, tipo: 'MODELO', titulo: 'Modelo de Plano de Trabalho', url: PDF.planoTrabalho, acessivel: false },
    // Edital 6 — Fomento Cultura 2025 (encerrado)
    { editalId: edital6.id, tipo: 'PDF', titulo: 'Edital PNAB 2025 — Fomento à Cultura', url: PDF.editalPNAB, acessivel: true },
    { editalId: edital6.id, tipo: 'MODELO', titulo: 'Modelo de Plano de Trabalho', url: PDF.planoTrabalho, acessivel: false },
    { editalId: edital6.id, tipo: 'DECLARACAO', titulo: 'Declarações Obrigatórias', url: PDF.declaracoes, acessivel: false },
  ]

  await prisma.arquivoEdital.createMany({ data: arquivos })
  console.log(`  ✔ ${arquivos.length} arquivos PDF criados`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. ATUALIZAR MANUAIS com URLs reais
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📚 Atualizando manuais com URLs reais...')
  await prisma.manual.updateMany({ where: { url: '/arquivos-indisponiveis', titulo: { contains: 'Guia' } }, data: { url: PDF.guiaPNAB } })
  await prisma.manual.updateMany({ where: { url: '/arquivos-indisponiveis', titulo: { contains: 'Prestação' } }, data: { url: PDF.planoTrabalho } })
  await prisma.manual.updateMany({ where: { url: '/arquivos-indisponiveis', titulo: { contains: 'Relatório' } }, data: { url: PDF.planoTrabalho } })
  await prisma.manual.updateMany({ where: { url: '/arquivos-indisponiveis', titulo: { contains: 'Elaboração' } }, data: { url: PDF.guiaPNAB } })
  await prisma.manual.updateMany({ where: { url: '/arquivos-indisponiveis', titulo: { contains: 'Regimento' } }, data: { url: PDF.editalPNAB } })
  console.log('  ✔ Manuais atualizados')

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. INSCRIÇÕES — Helper para criar inscrição idempotente
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📝 Criando inscrições...')

  async function upsertInscricao(data: {
    numero: string
    editalId: string
    proponenteId: string
    status: InscricaoStatus
    categoria: string
    campos: Record<string, string>
    notaFinal?: number
    motivoInabilitacao?: string
    submittedAt: Date
  }) {
    const existing = await prisma.inscricao.findUnique({ where: { numero: data.numero } })
    if (existing) {
      return prisma.inscricao.update({
        where: { numero: data.numero },
        data: {
          status: data.status,
          notaFinal: data.notaFinal ?? null,
          motivoInabilitacao: data.motivoInabilitacao ?? null,
        },
      })
    }
    return prisma.inscricao.create({
      data: {
        numero: data.numero,
        editalId: data.editalId,
        proponenteId: data.proponenteId,
        status: data.status,
        categoria: data.categoria,
        campos: data.campos,
        notaFinal: data.notaFinal ?? null,
        motivoInabilitacao: data.motivoInabilitacao ?? null,
        submittedAt: data.submittedAt,
      },
    })
  }

  // ── Edital 2 (HABILITACAO) — 6 inscrições ────────────────────────────────

  const e2Inscricoes = [
    { numero: 'AV26-001', prop: prop.carlos, categoria: 'Curta-metragem', status: 'HABILITADA' as const, nome: 'Sertão em Frames — Curta sobre a cultura de Irecê', desc: 'Curta-metragem documental de 15 minutos retratando o cotidiano cultural de Irecê, com foco nas manifestações artísticas populares do sertão baiano.', valor: '35000' },
    { numero: 'AV26-002', prop: prop.producoes, categoria: 'Documentário', status: 'HABILITADA' as const, nome: 'Vozes do Sertão — Documentário Musical', desc: 'Documentário de 45 minutos sobre os músicos tradicionais de Irecê e região, com entrevistas e performances ao vivo.', valor: '40000' },
    { numero: 'AV26-003', prop: prop.joana, categoria: 'Curta-metragem', status: 'HABILITADA' as const, nome: 'Raízes — Drama sobre Identidade Cultural', desc: 'Curta de ficção de 20 minutos sobre uma jovem que retorna a Irecê e redescobre suas raízes culturais.', valor: '30000' },
    { numero: 'AV26-004', prop: prop.marcos, categoria: 'Animação', status: 'INABILITADA' as const, nome: 'Lendas do Sertão Animado', desc: 'Série de 5 episódios animados sobre lendas e mitos do sertão baiano para público infanto-juvenil.', valor: '25000', motivo: 'Documentação incompleta: faltou comprovante de experiência em produção audiovisual conforme item 5.2 do edital.' },
    { numero: 'AV26-005', prop: prop.sertaoVivo, categoria: 'Documentário', status: 'ENVIADA' as const, nome: 'Memórias de Barro — Artesanato de Irecê', desc: 'Documentário sobre as ceramistas tradicionais de Irecê, técnicas ancestrais e a transmissão de saberes entre gerações.', valor: '28000' },
    { numero: 'AV26-006', prop: prop.coletivo, categoria: 'Curta-metragem', status: 'ENVIADA' as const, nome: 'Palco de Terra — Teatro Popular no Sertão', desc: 'Curta sobre grupos de teatro popular que se apresentam em comunidades rurais da região de Irecê.', valor: '32000' },
  ]

  for (const insc of e2Inscricoes) {
    await upsertInscricao({
      numero: insc.numero,
      editalId: edital2.id,
      proponenteId: insc.prop.id,
      status: insc.status,
      categoria: insc.categoria,
      campos: { nomeProjeto: insc.nome, descricao: insc.desc, valorSolicitado: insc.valor },
      motivoInabilitacao: (insc as { motivo?: string }).motivo,
      submittedAt: new Date('2026-02-15'),
    })
  }
  console.log(`  ✔ ${e2Inscricoes.length} inscrições do Edital 2 (Audiovisual/HABILITACAO)`)

  // ── Edital 3 (AVALIACAO) — 5 inscrições habilitadas com avaliações ───────

  const e3Inscricoes = [
    { numero: 'PT26-001', prop: prop.coletivo, categoria: 'Patrimônio Imaterial', nome: 'Mapeamento do Samba de Roda de Irecê', desc: 'Pesquisa e documentação das rodas de samba tradicionais de Irecê, incluindo registro audiovisual e formação de acervo digital.', valor: '35000', notas: [8.5, 7.0, 9.0, 7.5, 8.0] },
    { numero: 'PT26-002', prop: prop.sertaoVivo, categoria: 'Memória Oral', nome: 'Histórias dos Anciãos — Memória Oral do Sertão', desc: 'Coleta e transcrição de relatos orais de idosos de comunidades tradicionais, formando acervo de memória cultural.', valor: '28000', notas: [9.0, 8.0, 9.5, 8.0, 7.5] },
    { numero: 'PT26-003', prop: prop.carlos, categoria: 'Patrimônio Material', nome: 'Restauro da Casa de Farinha Comunitária', desc: 'Restauração e revitalização de casa de farinha centenária no distrito de Angical, com abertura para visitação pública.', valor: '40000', notas: [7.0, 6.5, 8.0, 6.0, 7.0] },
    { numero: 'PT26-004', prop: prop.joana, categoria: 'Patrimônio Imaterial', nome: 'Receitas do Sertão — Patrimônio Gastronômico', desc: 'Documentação de receitas tradicionais do sertão baiano, com publicação de livro ilustrado e oficinas culinárias.', valor: '25000', notas: null },
    { numero: 'PT26-005', prop: prop.marcos, categoria: 'Memória Oral', nome: 'Causos e Cantigas — Tradição Oral Sertaneja', desc: 'Registro e publicação de causos, cantigas e cordéis da tradição oral da região de Irecê.', valor: '22000', notas: null },
  ]

  for (const insc of e3Inscricoes) {
    const inscricao = await upsertInscricao({
      numero: insc.numero,
      editalId: edital3.id,
      proponenteId: insc.prop.id,
      status: insc.notas ? 'EM_AVALIACAO' : 'HABILITADA',
      categoria: insc.categoria,
      campos: { nomeProjeto: insc.nome, descricao: insc.desc, valorSolicitado: insc.valor },
      submittedAt: new Date('2026-01-20'),
    })

    // Criar avaliações para as que têm notas
    if (insc.notas) {
      const notasDetalhadas = CRITERIOS_AVALIACAO.map((c, i) => ({
        criterio: c.criterio,
        nota: insc.notas![i],
        peso: c.peso,
      }))
      const notaTotal = calcNotaTotal(notasDetalhadas)

      await prisma.avaliacao.upsert({
        where: { inscricaoId_avaliadorId: { inscricaoId: inscricao.id, avaliadorId: avaliador.id } },
        update: { notas: notasDetalhadas, notaTotal, finalizada: true },
        create: {
          inscricaoId: inscricao.id,
          avaliadorId: avaliador.id,
          notas: notasDetalhadas,
          parecer: `Projeto "${insc.nome}" avaliado com base nos critérios estabelecidos no edital. ${notaTotal >= 7.5 ? 'Projeto demonstra boa qualidade técnica e relevância cultural.' : 'Projeto apresenta pontos a melhorar na viabilidade técnica.'}`,
          notaTotal,
          finalizada: true,
        },
      })
    }
  }
  console.log(`  ✔ ${e3Inscricoes.length} inscrições do Edital 3 (Patrimônio/AVALIACAO) + avaliações`)

  // ── Edital 4 (RESULTADO_PRELIMINAR) — 8 inscrições com ranking ───────────

  const e4Inscricoes = [
    { numero: 'FM26-001', prop: prop.joana, categoria: 'Formação', nome: 'Oficina de Bordado Artístico Sertanejo', desc: 'Oficina de 40h de bordado artístico tradicional para 25 mulheres de comunidades rurais.', valor: '12000', notas: [9.0, 8.5, 9.5, 8.0, 9.0], resultado: 'CONTEMPLADA' as const },
    { numero: 'FM26-002', prop: prop.carlos, categoria: 'Oficinas', nome: 'Workshop de Forró Pé de Serra para Jovens', desc: 'Formação de 60h em forró tradicional para 30 jovens, incluindo história, dança e musicalidade.', valor: '15000', notas: [8.5, 9.0, 8.5, 9.0, 8.0], resultado: 'CONTEMPLADA' as const },
    { numero: 'FM26-003', prop: prop.sertaoVivo, categoria: 'Capacitação', nome: 'Formação em Gestão Cultural Comunitária', desc: 'Curso de 80h em gestão cultural para 20 líderes comunitários de Irecê.', valor: '18000', notas: [8.0, 8.5, 8.0, 7.5, 8.5], resultado: 'CONTEMPLADA' as const },
    { numero: 'FM26-004', prop: prop.coletivo, categoria: 'Formação', nome: 'Oficina de Teatro de Rua — Corpo e Praça', desc: 'Oficina de teatro de rua de 48h para 20 participantes, com montagem final apresentada em praça pública.', valor: '10000', notas: [7.5, 8.0, 8.5, 7.0, 8.0], resultado: 'CONTEMPLADA' as const },
    { numero: 'FM26-005', prop: prop.producoes, categoria: 'Oficinas', nome: 'Workshop de Produção Audiovisual com Celular', desc: 'Workshop de 30h sobre produção de vídeos culturais utilizando smartphones para 25 jovens.', valor: '8000', notas: [8.0, 7.5, 7.5, 8.0, 7.0], resultado: 'CONTEMPLADA' as const },
    { numero: 'FM26-006', prop: prop.marcos, categoria: 'Formação', nome: 'Curso de Percussão Afro-Sertaneja', desc: 'Formação em percussão de 50h para 20 participantes, integrando ritmos africanos e sertanejos.', valor: '11000', notas: [7.0, 7.5, 8.0, 7.0, 7.5], resultado: 'SUPLENTE' as const },
    { numero: 'FM26-007', prop: prop.joana, categoria: 'Capacitação', nome: 'Oficina de Escrita Criativa — Contos do Sertão', desc: 'Oficina de escrita criativa de 36h para 20 participantes, com publicação coletiva.', valor: '9000', notas: [6.5, 7.0, 7.0, 6.5, 7.5], resultado: 'NAO_CONTEMPLADA' as const },
    { numero: 'FM26-008', prop: prop.carlos, categoria: 'Oficinas', nome: 'Masterclass de Viola Caipira', desc: 'Masterclass intensiva de 20h de viola caipira para 15 músicos iniciantes e intermediários.', valor: '7000', notas: [6.0, 6.5, 6.0, 7.0, 6.5], resultado: 'RECURSO_ABERTO' as const },
  ]

  for (const insc of e4Inscricoes) {
    const notasDetalhadas = CRITERIOS_AVALIACAO.map((c, i) => ({
      criterio: c.criterio,
      nota: insc.notas[i],
      peso: c.peso,
    }))
    const notaTotal = calcNotaTotal(notasDetalhadas)

    const inscricao = await upsertInscricao({
      numero: insc.numero,
      editalId: edital4.id,
      proponenteId: insc.prop.id,
      status: insc.resultado,
      categoria: insc.categoria,
      campos: { nomeProjeto: insc.nome, descricao: insc.desc, valorSolicitado: insc.valor },
      notaFinal: notaTotal,
      submittedAt: new Date('2025-11-15'),
    })

    // Avaliação
    await prisma.avaliacao.upsert({
      where: { inscricaoId_avaliadorId: { inscricaoId: inscricao.id, avaliadorId: avaliador.id } },
      update: { notas: notasDetalhadas, notaTotal, finalizada: true },
      create: {
        inscricaoId: inscricao.id,
        avaliadorId: avaliador.id,
        notas: notasDetalhadas,
        parecer: `Avaliação técnica do projeto "${insc.nome}". Nota final: ${notaTotal.toFixed(2)}.`,
        notaTotal,
        finalizada: true,
      },
    })

    // Recurso para a última inscrição (FM26-008)
    if (insc.resultado === 'RECURSO_ABERTO') {
      const existingRecurso = await prisma.recurso.findFirst({
        where: { inscricaoId: inscricao.id, fase: 'RESULTADO_PRELIMINAR' },
      })
      if (!existingRecurso) {
        await prisma.recurso.create({
          data: {
            inscricaoId: inscricao.id,
            fase: 'RESULTADO_PRELIMINAR',
            texto: 'Venho por meio deste interpor recurso contra o resultado preliminar do Edital de Formação Cultural 2026. Considero que o critério "Contrapartida social" não foi adequadamente avaliado, visto que meu projeto prevê atendimento gratuito a 15 músicos de baixa renda da periferia de Irecê, conforme detalhado no Plano de Trabalho (item 7.3). Solicito reavaliação da pontuação neste critério.',
            urlAnexos: [],
          },
        })
      }
    }
  }
  console.log(`  ✔ ${e4Inscricoes.length} inscrições do Edital 4 (Formação/RESULTADO_PRELIMINAR) + avaliações + recurso`)

  // ── Edital 5 (RESULTADO_FINAL) — 6 inscrições com resultado definitivo ───

  const e5Inscricoes = [
    { numero: 'PC25-001', prop: prop.sertaoVivo, categoria: 'Pontos de Cultura', nome: 'Casa do Samba de Roda — Bairro São José', desc: 'Espaço cultural dedicado à preservação do samba de roda, com ensaios semanais, rodas abertas e oficinas para crianças.', valor: '20000', notas: [9.5, 9.0, 9.5, 8.5, 9.0], resultado: 'CONTEMPLADA' as const },
    { numero: 'PC25-002', prop: prop.coletivo, categoria: 'Espaços Culturais', nome: 'Ateliê Cores do Sertão — Centro', desc: 'Ateliê coletivo de artes visuais com exposição permanente, oficinas de pintura e espaço para artistas locais.', valor: '20000', notas: [9.0, 8.5, 9.0, 9.0, 8.5], resultado: 'CONTEMPLADA' as const },
    { numero: 'PC25-003', prop: prop.carlos, categoria: 'Pontos de Cultura', nome: 'Espaço Capoeira Raízes — Caixa d\'Água', desc: 'Centro de capoeira angola e regional com treinos diários, rodas semanais e integração com escolas públicas.', valor: '20000', notas: [8.5, 8.0, 9.0, 8.0, 9.0], resultado: 'CONTEMPLADA' as const },
    { numero: 'PC25-004', prop: prop.joana, categoria: 'Pontos de Cultura', nome: 'Biblioteca Comunitária Leitura Viva — Vila Esperança', desc: 'Biblioteca comunitária com acervo de 3.000 livros, contação de histórias, saraus literários e clube de leitura.', valor: '20000', notas: [8.0, 7.5, 8.5, 7.5, 8.5], resultado: 'CONTEMPLADA' as const },
    { numero: 'PC25-005', prop: prop.marcos, categoria: 'Espaços Culturais', nome: 'Studio de Música Harmonia — Bairro Alto', desc: 'Estúdio de gravação comunitário com instrumentos disponíveis, aulas de música e produção de artistas locais.', valor: '20000', notas: [7.5, 7.0, 7.5, 7.5, 7.0], resultado: 'SUPLENTE' as const },
    { numero: 'PC25-006', prop: prop.producoes, categoria: 'Pontos de Cultura', nome: 'Cine Sertão — Sessões Comunitárias', desc: 'Projeto de cinema itinerante em praças e escolas com projeção de filmes nacionais e debates sobre cultura.', valor: '20000', notas: [7.0, 6.5, 7.0, 6.5, 6.0], resultado: 'NAO_CONTEMPLADA' as const },
  ]

  for (const insc of e5Inscricoes) {
    const notasDetalhadas = CRITERIOS_AVALIACAO.map((c, i) => ({
      criterio: c.criterio,
      nota: insc.notas[i],
      peso: c.peso,
    }))
    const notaTotal = calcNotaTotal(notasDetalhadas)

    const inscricao = await upsertInscricao({
      numero: insc.numero,
      editalId: edital5.id,
      proponenteId: insc.prop.id,
      status: insc.resultado,
      categoria: insc.categoria,
      campos: { nomeProjeto: insc.nome, descricao: insc.desc, valorSolicitado: insc.valor },
      notaFinal: notaTotal,
      submittedAt: new Date('2025-06-20'),
    })

    // Avaliação
    await prisma.avaliacao.upsert({
      where: { inscricaoId_avaliadorId: { inscricaoId: inscricao.id, avaliadorId: avaliador.id } },
      update: { notas: notasDetalhadas, notaTotal, finalizada: true },
      create: {
        inscricaoId: inscricao.id,
        avaliadorId: avaliador.id,
        notas: notasDetalhadas,
        parecer: `Avaliação do espaço cultural "${insc.nome}". Nota final: ${notaTotal.toFixed(2)}.`,
        notaTotal,
        finalizada: true,
      },
    })

    // Projetos apoiados para contempladas
    if (insc.resultado === 'CONTEMPLADA') {
      const existingProjeto = await prisma.projetoApoiado.findUnique({ where: { inscricaoId: inscricao.id } })
      if (!existingProjeto) {
        await prisma.projetoApoiado.create({
          data: {
            inscricaoId: inscricao.id,
            valorAprovado: parseInt(insc.valor),
            statusExecucao: 'EM_EXECUCAO',
            contrapartida: `Manutenção do espaço "${insc.nome}" com atividades culturais abertas ao público.`,
            publicado: true,
          },
        })
      }
    }
  }
  console.log(`  ✔ ${e5Inscricoes.length} inscrições do Edital 5 (Pontos de Cultura/RESULTADO_FINAL) + projetos apoiados`)

  // ── Edital 6 (ENCERRADO) — 5 inscrições contempladas com projetos ────────

  const e6Inscricoes = [
    { numero: 'FC25-001', prop: prop.carlos, categoria: 'Música', nome: 'Festival de Forró Pé de Serra — Edição 2025', desc: 'Festival com 3 dias de apresentações de forró tradicional em praça pública, com 12 artistas locais e regionais.', valor: '45000', notas: [9.0, 8.5, 9.0, 8.0, 8.5], exec: 'CONCLUIDO' as const, contra: 'Oficina de forró para 30 jovens da comunidade realizada com sucesso.' },
    { numero: 'FC25-002', prop: prop.sertaoVivo, categoria: 'Teatro', nome: 'Espetáculo "Raízes" — Teatro Popular', desc: 'Montagem teatral sobre a história cultural de Irecê com elenco de 15 atores locais e 3 apresentações gratuitas.', valor: '35000', notas: [8.5, 8.0, 9.0, 7.5, 8.0], exec: 'CONCLUIDO' as const, contra: '3 apresentações gratuitas em escolas públicas e uma no Centro Cultural.' },
    { numero: 'FC25-003', prop: prop.joana, categoria: 'Dança', nome: 'Cia. de Dança Contemporânea do Sertão', desc: 'Criação e apresentação de espetáculo de dança contemporânea inspirado na cultura sertaneja.', valor: '28000', notas: [8.0, 7.5, 8.5, 7.0, 8.0], exec: 'EM_EXECUCAO' as const, contra: 'Workshop de dança para 20 participantes em andamento.' },
    { numero: 'FC25-004', prop: prop.coletivo, categoria: 'Artesanato', nome: 'Cerâmica Artística de Irecê — Exposição e Oficinas', desc: 'Exposição de cerâmica artística sertaneja com 30 peças e oficinas de modelagem para a comunidade.', valor: '20000', notas: [7.5, 7.0, 8.0, 6.5, 7.5], exec: 'EM_EXECUCAO' as const, contra: 'Exposição aberta ao público por 30 dias + oficina para 15 participantes.' },
    { numero: 'FC25-005', prop: prop.producoes, categoria: 'Artes Visuais', nome: 'Murais de Irecê — Arte Urbana no Sertão', desc: 'Pintura de 8 murais artísticos em prédios públicos e muros de Irecê com temática cultural sertaneja.', valor: '32000', notas: [8.5, 8.0, 8.0, 8.5, 7.5], exec: 'EM_EXECUCAO' as const, contra: 'Oficina de grafite para 20 jovens durante a execução dos murais.' },
  ]

  for (const insc of e6Inscricoes) {
    const notasDetalhadas = CRITERIOS_AVALIACAO.map((c, i) => ({
      criterio: c.criterio,
      nota: insc.notas[i],
      peso: c.peso,
    }))
    const notaTotal = calcNotaTotal(notasDetalhadas)

    const inscricao = await upsertInscricao({
      numero: insc.numero,
      editalId: edital6.id,
      proponenteId: insc.prop.id,
      status: 'CONTEMPLADA',
      categoria: insc.categoria,
      campos: { nomeProjeto: insc.nome, descricao: insc.desc, valorSolicitado: insc.valor },
      notaFinal: notaTotal,
      submittedAt: new Date('2025-04-15'),
    })

    // Avaliação
    await prisma.avaliacao.upsert({
      where: { inscricaoId_avaliadorId: { inscricaoId: inscricao.id, avaliadorId: avaliador.id } },
      update: { notas: notasDetalhadas, notaTotal, finalizada: true },
      create: {
        inscricaoId: inscricao.id,
        avaliadorId: avaliador.id,
        notas: notasDetalhadas,
        parecer: `Projeto "${insc.nome}" aprovado com nota ${notaTotal.toFixed(2)}.`,
        notaTotal,
        finalizada: true,
      },
    })

    // Projeto apoiado
    const existingProjeto = await prisma.projetoApoiado.findUnique({ where: { inscricaoId: inscricao.id } })
    if (!existingProjeto) {
      await prisma.projetoApoiado.create({
        data: {
          inscricaoId: inscricao.id,
          valorAprovado: parseInt(insc.valor),
          statusExecucao: insc.exec,
          contrapartida: insc.contra,
          publicado: true,
        },
      })
    }
  }
  console.log(`  ✔ ${e6Inscricoes.length} inscrições do Edital 6 (Fomento Cultura/ENCERRADO) + projetos apoiados`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. ATUALIZAR BANNER para 2026
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n🎯 Atualizando banner...')
  await prisma.banner.updateMany({
    where: { id: 'seed-banner-1' },
    data: {
      titulo: 'Inscrições abertas!',
      texto: 'Edital PNAB 2026 — Fomento às Artes está com inscrições abertas até 30/04/2026.',
      ctaLabel: 'Ver edital',
      ctaUrl: '/editais/pnab-2026-fomento-artes',
    },
  })
  console.log('  ✔ Banner atualizado para 2026')

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. ATUALIZAR NOTÍCIAS com datas 2025/2026
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n📰 Atualizando notícias...')

  // Atualizar a notícia principal do edital
  await prisma.noticia.upsert({
    where: { slug: 'edital-pnab-2026-publicado' },
    update: {},
    create: {
      titulo: 'Edital PNAB 2026 é publicado com R$ 600 mil para fomento cultural',
      slug: 'edital-pnab-2026-publicado',
      corpo: 'A Secretaria de Arte e Cultura de Irecê publicou o Edital PNAB 2026 de Fomento às Artes, com investimento total de R$ 600 mil.\n\nO edital contempla seis categorias artísticas: Música, Dança, Teatro, Artes Visuais, Audiovisual e Literatura. Serão selecionados até 12 projetos titulares e 4 suplentes.\n\n## Ações Afirmativas\n\nO edital prevê cotas de 30% para proponentes negros, indígenas e quilombolas, além de 10% para pessoas com deficiência.\n\n## Inscrições\n\nAs inscrições estão abertas de 1º de março a 30 de abril de 2026, exclusivamente pela plataforma digital.',
      tags: ['PNAB', 'Edital', '2026', 'Fomento'],
      publicado: true,
      publicadoEm: new Date('2026-02-01'),
    },
  })

  await prisma.noticia.upsert({
    where: { slug: 'resultado-preliminar-formacao-2026' },
    update: {},
    create: {
      titulo: 'Resultado preliminar do Edital de Formação Cultural 2026 é divulgado',
      slug: 'resultado-preliminar-formacao-2026',
      corpo: 'A Secretaria de Arte e Cultura divulga o resultado preliminar do Edital de Formação Cultural 2026 — Oficinas e Workshops.\n\nForam avaliadas 8 propostas de formação cultural. O prazo para interposição de recursos é de 10 dias a partir desta publicação.\n\n## Resultado\n\nAs propostas selecionadas incluem oficinas de bordado, forró, gestão cultural, teatro de rua e produção audiovisual, totalizando mais de 130 vagas de formação para a comunidade ireceense.\n\nConsulte o resultado completo na página do edital.',
      tags: ['Formação', 'Resultado Preliminar', '2026'],
      publicado: true,
      publicadoEm: new Date('2026-02-15'),
    },
  })

  console.log('  ✔ Notícias atualizadas')

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMO
  // ═══════════════════════════════════════════════════════════════════════════

  const totalInscricoes = await prisma.inscricao.count()
  const totalAvaliacoes = await prisma.avaliacao.count()
  const totalProjetos = await prisma.projetoApoiado.count()
  const totalRecursos = await prisma.recurso.count()

  console.log('\n════════════════════════════════════════════════════════════════')
  console.log('  ✅ Seed Demo concluído!')
  console.log('════════════════════════════════════════════════════════════════')
  console.log('')
  console.log('  📋 6 editais em diferentes estágios:')
  console.log('    1. Fomento às Artes 2026     → INSCRICOES_ABERTAS')
  console.log('    2. Audiovisual 2026           → HABILITACAO')
  console.log('    3. Patrimônio Cultural 2026   → AVALIACAO')
  console.log('    4. Formação Cultural 2026     → RESULTADO_PRELIMINAR')
  console.log('    5. Pontos de Cultura 2025     → RESULTADO_FINAL')
  console.log('    6. Fomento à Cultura 2025     → ENCERRADO')
  console.log('')
  console.log(`  📝 ${totalInscricoes} inscrições totais`)
  console.log(`  📊 ${totalAvaliacoes} avaliações`)
  console.log(`  📢 ${totalRecursos} recurso(s)`)
  console.log(`  🏆 ${totalProjetos} projetos apoiados`)
  console.log('')
  console.log('  📎 PDFs reais da PNAB vinculados')
  console.log('  📍 Endereços reais de Irecê/BA nos proponentes')
  console.log('════════════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed-demo:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
