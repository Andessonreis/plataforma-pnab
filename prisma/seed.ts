import { PrismaClient, UserRole, TipoProponente } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Senha padrão para todos os usuários de teste: "Teste@123"
const DEFAULT_PASSWORD = 'Teste@123'

async function main() {
  const passwordHash = await hash(DEFAULT_PASSWORD, 12)

  // ─────────────────────────────────────────────────────────────────────────
  // Usuários — um de cada role
  // ─────────────────────────────────────────────────────────────────────────

  const users = [
    {
      email: 'admin@pnab.irece.ba.gov.br',
      nome: 'Administrador PNAB',
      role: UserRole.ADMIN,
      cpfCnpj: '00000000001',
    },
    {
      email: 'atendimento@pnab.irece.ba.gov.br',
      nome: 'Atendente Maria',
      role: UserRole.ATENDIMENTO,
      cpfCnpj: '00000000002',
    },
    {
      email: 'habilitador@pnab.irece.ba.gov.br',
      nome: 'Habilitador João',
      role: UserRole.HABILITADOR,
      cpfCnpj: '00000000003',
    },
    {
      email: 'avaliador@pnab.irece.ba.gov.br',
      nome: 'Avaliadora Ana',
      role: UserRole.AVALIADOR,
      cpfCnpj: '00000000004',
    },
    {
      email: 'proponente@teste.com',
      nome: 'Carlos Proponente PF',
      role: UserRole.PROPONENTE,
      cpfCnpj: '12345678901',
      tipoProponente: TipoProponente.PF,
      telefone: '(74) 99999-0001',
    },
    {
      email: 'proponente.mei@teste.com',
      nome: 'Associação Cultural Sertão Vivo',
      role: UserRole.PROPONENTE,
      cpfCnpj: '12345678000190',
      tipoProponente: TipoProponente.MEI,
      telefone: '(74) 99999-0002',
    },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: passwordHash,
        role: u.role,
        nome: u.nome,
        cpfCnpj: u.cpfCnpj,
        tipoProponente: u.tipoProponente ?? null,
        telefone: u.telefone ?? null,
      },
    })
  }

  console.log(`✔ ${users.length} usuários criados/atualizados`)

  // ─────────────────────────────────────────────────────────────────────────
  // Banner ativo
  // ─────────────────────────────────────────────────────────────────────────

  await prisma.banner.upsert({
    where: { id: 'seed-banner-1' },
    update: {},
    create: {
      id: 'seed-banner-1',
      titulo: 'Inscrições abertas!',
      texto: 'Edital PNAB 2025 — Fomento às Artes está com inscrições abertas até 30/06.',
      ctaLabel: 'Ver edital',
      ctaUrl: '/editais/pnab-2025-fomento-artes',
      ativo: true,
      inicioEm: new Date('2025-01-01'),
      fimEm: new Date('2026-12-31'),
    },
  })

  console.log('✔ Banner de teste criado')

  // ─────────────────────────────────────────────────────────────────────────
  // Edital de exemplo
  // ─────────────────────────────────────────────────────────────────────────

  const edital = await prisma.edital.upsert({
    where: { slug: 'pnab-2025-fomento-artes' },
    update: {},
    create: {
      titulo: 'Edital PNAB 2025 — Fomento às Artes',
      slug: 'pnab-2025-fomento-artes',
      ano: 2025,
      status: 'INSCRICOES_ABERTAS',
      resumo: 'Edital de fomento à cultura para projetos artísticos no município de Irecê/BA.',
      valorTotal: 500000,
      categorias: ['Música', 'Dança', 'Teatro', 'Artes Visuais', 'Audiovisual', 'Literatura'],
      acoesAfirmativas: 'Cotas de 30% para proponentes negros, indígenas e quilombolas.',
      regrasElegibilidade: 'Proponentes com domicílio em Irecê/BA há pelo menos 2 anos.',
      cronograma: JSON.stringify([
        { label: 'Publicação do edital', dataHora: '2025-03-01T00:00:00', destaque: false },
        { label: 'Início das inscrições', dataHora: '2025-04-01T00:00:00', destaque: true },
        { label: 'Encerramento das inscrições', dataHora: '2025-06-30T23:59:59', destaque: true },
        { label: 'Resultado preliminar', dataHora: '2025-08-15T00:00:00', destaque: false },
        { label: 'Resultado final', dataHora: '2025-09-30T00:00:00', destaque: true },
      ]),
      camposFormulario: JSON.stringify([
        { nome: 'nomeProjeto', label: 'Nome do projeto', tipo: 'text', obrigatorio: true },
        { nome: 'descricao', label: 'Descrição do projeto', tipo: 'textarea', obrigatorio: true },
        { nome: 'valorSolicitado', label: 'Valor solicitado (R$)', tipo: 'number', obrigatorio: true },
      ]),
    },
  })

  console.log('✔ Edital de teste criado')

  // ─────────────────────────────────────────────────────────────────────────
  // FAQ
  // ─────────────────────────────────────────────────────────────────────────

  const faqItems = [
    { pergunta: 'Quem pode se inscrever?', resposta: 'Pessoas físicas ou jurídicas com domicílio em Irecê/BA há pelo menos 2 anos, conforme regras do edital.' },
    { pergunta: 'Qual o valor máximo por projeto?', resposta: 'O valor máximo por projeto varia conforme a categoria. Consulte o edital para detalhes.' },
    { pergunta: 'Como funciona o recurso?', resposta: 'Após a publicação do resultado preliminar, os proponentes têm 5 dias úteis para interpor recurso pela plataforma.' },
  ]

  for (let i = 0; i < faqItems.length; i++) {
    await prisma.faqItem.upsert({
      where: { id: `seed-faq-${i + 1}` },
      update: {},
      create: {
        id: `seed-faq-${i + 1}`,
        editalId: edital.id,
        pergunta: faqItems[i].pergunta,
        resposta: faqItems[i].resposta,
        ordem: i + 1,
        publicado: true,
      },
    })
  }

  console.log(`✔ ${faqItems.length} itens de FAQ criados`)

  // ─────────────────────────────────────────────────────────────────────────
  // Notícia de exemplo
  // ─────────────────────────────────────────────────────────────────────────

  await prisma.noticia.upsert({
    where: { slug: 'edital-pnab-2025-publicado' },
    update: {},
    create: {
      titulo: 'Edital PNAB 2025 é publicado com R$ 500 mil para fomento cultural',
      slug: 'edital-pnab-2025-publicado',
      corpo: 'A Secretaria de Arte e Cultura de Irecê publicou nesta segunda-feira o Edital PNAB 2025 de Fomento às Artes, com investimento total de R$ 500 mil. O edital contempla seis categorias artísticas e prevê ações afirmativas com cotas de 30% para proponentes negros, indígenas e quilombolas. As inscrições serão realizadas exclusivamente pela plataforma digital e vão de 1º de abril a 30 de junho de 2025.',
      tags: ['PNAB', 'Edital', '2025', 'Fomento'],
      publicado: true,
      publicadoEm: new Date('2025-03-01'),
    },
  })

  console.log('✔ Notícia de teste criada')

  // ─────────────────────────────────────────────────────────────────────────
  // Resumo
  // ─────────────────────────────────────────────────────────────────────────

  console.log('\n────────────────────────────────────────')
  console.log('Seed concluído! Credenciais de teste:')
  console.log('────────────────────────────────────────')
  console.log(`Senha para todos: ${DEFAULT_PASSWORD}`)
  console.log('')
  console.log('ADMIN          → admin@pnab.irece.ba.gov.br')
  console.log('ATENDIMENTO    → atendimento@pnab.irece.ba.gov.br')
  console.log('HABILITADOR    → habilitador@pnab.irece.ba.gov.br')
  console.log('AVALIADOR      → avaliador@pnab.irece.ba.gov.br')
  console.log('PROPONENTE PF  → proponente@teste.com')
  console.log('PROPONENTE MEI → proponente.mei@teste.com')
  console.log('────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
