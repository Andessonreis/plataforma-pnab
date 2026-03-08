import { PrismaClient, UserRole, TipoProponente } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Senha padrão para todos os usuários de teste: "Teste@123"
const DEFAULT_PASSWORD = 'Teste@123'

async function main() {
  const passwordHash = await hash(DEFAULT_PASSWORD, 12)

  // ─────────────────────────────────────────────────────────────────────────
  // Usuários — um de cada role + proponentes variados
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
      nome: 'Carlos Silva',
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
    {
      email: 'joana.arte@teste.com',
      nome: 'Joana Souza dos Santos',
      role: UserRole.PROPONENTE,
      cpfCnpj: '98765432100',
      tipoProponente: TipoProponente.PF,
      telefone: '(74) 99888-1234',
    },
    {
      email: 'coletivo.raizes@teste.com',
      nome: 'Coletivo Cultural Raízes do Sertão',
      role: UserRole.PROPONENTE,
      cpfCnpj: '11222333000155',
      tipoProponente: TipoProponente.COLETIVO,
      telefone: '(74) 99777-5678',
    },
    {
      email: 'producoes.irece@teste.com',
      nome: 'Irecê Produções Artísticas LTDA',
      role: UserRole.PROPONENTE,
      cpfCnpj: '44555666000188',
      tipoProponente: TipoProponente.PJ,
      telefone: '(74) 3641-9090',
    },
    {
      email: 'marcos.teatro@teste.com',
      nome: 'Marcos Oliveira',
      role: UserRole.PROPONENTE,
      cpfCnpj: '55667788900',
      tipoProponente: TipoProponente.PF,
      telefone: '(74) 99666-4321',
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
  // Banners
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
      fimEm: new Date('2027-12-31'),
    },
  })

  console.log('✔ Banner criado')

  // ─────────────────────────────────────────────────────────────────────────
  // Editais — 6 editais em diferentes status
  // ─────────────────────────────────────────────────────────────────────────

  const editaisData = [
    {
      slug: 'pnab-2025-fomento-artes',
      titulo: 'Edital PNAB 2025 — Fomento às Artes',
      ano: 2025,
      status: 'INSCRICOES_ABERTAS' as const,
      resumo: 'Edital de fomento à cultura para projetos artísticos no município de Irecê/BA. Contempla seis categorias artísticas com investimento total de R$ 500 mil, incluindo ações afirmativas com cotas de 30% para proponentes negros, indígenas e quilombolas.',
      valorTotal: 500000,
      categorias: ['Música', 'Dança', 'Teatro', 'Artes Visuais', 'Audiovisual', 'Literatura'],
      acoesAfirmativas: 'Cotas de 30% para proponentes negros, indígenas e quilombolas.\nCotas de 10% para pessoas com deficiência.\nBônus de pontuação para projetos realizados em comunidades rurais.',
      regrasElegibilidade: 'Proponentes com domicílio em Irecê/BA há pelo menos 2 anos.\nIdade mínima de 18 anos para pessoa física.\nCNPJ ativo há pelo menos 1 ano para pessoa jurídica.\nNão possuir pendências com a Secretaria de Cultura.',
      cronograma: [
        { label: 'Publicação do edital', dataHora: '2025-03-01T00:00:00', destaque: false },
        { label: 'Início das inscrições', dataHora: '2025-04-01T00:00:00', destaque: true },
        { label: 'Encerramento das inscrições', dataHora: '2025-06-30T23:59:59', destaque: true },
        { label: 'Habilitação', dataHora: '2025-07-15T00:00:00', destaque: false },
        { label: 'Resultado preliminar', dataHora: '2025-08-15T00:00:00', destaque: false },
        { label: 'Prazo de recursos', dataHora: '2025-08-25T23:59:59', destaque: false },
        { label: 'Resultado final', dataHora: '2025-09-30T00:00:00', destaque: true },
      ],
    },
    {
      slug: 'pnab-2025-audiovisual',
      titulo: 'Edital de Audiovisual 2025 — Curtas e Documentários',
      ano: 2025,
      status: 'INSCRICOES_ABERTAS' as const,
      resumo: 'Seleção pública para financiamento de produção de curtas-metragens e documentários com temática cultural do sertão baiano. Serão selecionados até 8 projetos com valores entre R$ 15 mil e R$ 40 mil cada.',
      valorTotal: 200000,
      categorias: ['Audiovisual', 'Documentário', 'Curta-metragem'],
      acoesAfirmativas: 'Reserva de 25% das vagas para realizadores negros e indígenas.',
      regrasElegibilidade: 'Proponentes residentes no Território de Identidade de Irecê.\nExperiência comprovada em produção audiovisual.',
      cronograma: [
        { label: 'Publicação', dataHora: '2025-03-15T00:00:00', destaque: false },
        { label: 'Abertura das inscrições', dataHora: '2025-04-15T00:00:00', destaque: true },
        { label: 'Encerramento das inscrições', dataHora: '2025-07-15T23:59:59', destaque: true },
        { label: 'Resultado final', dataHora: '2025-10-01T00:00:00', destaque: true },
      ],
    },
    {
      slug: 'pnab-2025-patrimonio-cultural',
      titulo: 'Edital de Patrimônio Cultural 2025',
      ano: 2025,
      status: 'PUBLICADO' as const,
      resumo: 'Chamamento público para projetos de preservação, documentação e valorização do patrimônio cultural material e imaterial de Irecê e região. Foco em tradições orais, saberes populares e edificações históricas.',
      valorTotal: 150000,
      categorias: ['Patrimônio Material', 'Patrimônio Imaterial', 'Memória'],
      acoesAfirmativas: null,
      regrasElegibilidade: 'Proponentes com domicílio em Irecê/BA.\nProjetos devem ter contrapartida social obrigatória.',
      cronograma: [
        { label: 'Publicação', dataHora: '2025-04-01T00:00:00', destaque: false },
        { label: 'Abertura das inscrições', dataHora: '2025-05-01T00:00:00', destaque: true },
        { label: 'Encerramento', dataHora: '2025-07-30T23:59:59', destaque: true },
      ],
    },
    {
      slug: 'pnab-2024-fomento-cultura',
      titulo: 'Edital PNAB 2024 — Fomento à Cultura',
      ano: 2024,
      status: 'ENCERRADO' as const,
      resumo: 'Primeiro edital PNAB de Irecê com seleção de 15 projetos culturais em diversas linguagens artísticas. Processo encerrado com sucesso e projetos em fase de execução.',
      valorTotal: 350000,
      categorias: ['Música', 'Dança', 'Teatro', 'Artesanato'],
      acoesAfirmativas: 'Cotas de 20% para proponentes negros e indígenas.',
      regrasElegibilidade: 'Proponentes com domicílio em Irecê/BA há pelo menos 1 ano.',
      cronograma: [
        { label: 'Publicação', dataHora: '2024-03-01T00:00:00', destaque: false },
        { label: 'Inscrições', dataHora: '2024-04-01T00:00:00', destaque: false },
        { label: 'Resultado final', dataHora: '2024-08-15T00:00:00', destaque: true },
      ],
    },
    {
      slug: 'pnab-2024-pontos-cultura',
      titulo: 'Pontos de Cultura 2024 — Rede Municipal',
      ano: 2024,
      status: 'RESULTADO_FINAL' as const,
      resumo: 'Seleção de espaços culturais independentes para integrar a Rede Municipal de Pontos de Cultura de Irecê. Apoio financeiro de R$ 20 mil por ponto selecionado para manutenção e atividades culturais contínuas.',
      valorTotal: 120000,
      categorias: ['Pontos de Cultura', 'Espaços Culturais'],
      acoesAfirmativas: 'Prioridade para espaços em comunidades periféricas e rurais.',
      regrasElegibilidade: 'Espaços culturais em funcionamento há pelo menos 1 ano.\nComprovação de atividades culturais regulares.',
      cronograma: [
        { label: 'Publicação', dataHora: '2024-05-01T00:00:00', destaque: false },
        { label: 'Inscrições', dataHora: '2024-06-01T00:00:00', destaque: false },
        { label: 'Resultado final', dataHora: '2024-10-01T00:00:00', destaque: true },
      ],
    },
    {
      slug: 'pnab-2025-formacao-cultural',
      titulo: 'Edital de Formação Cultural 2025 — Oficinas e Workshops',
      ano: 2025,
      status: 'HABILITACAO' as const,
      resumo: 'Seleção de propostas de oficinas, workshops e cursos de formação artístico-cultural para a comunidade ireceense. Voltado para multiplicação de saberes e capacitação de novos artistas.',
      valorTotal: 80000,
      categorias: ['Formação', 'Oficinas', 'Capacitação'],
      acoesAfirmativas: 'Reserva de 30% para formadores de comunidades tradicionais.',
      regrasElegibilidade: 'Proponentes com experiência comprovada na área de formação proposta.\nProjetos devem atender no mínimo 20 participantes.',
      cronograma: [
        { label: 'Publicação', dataHora: '2025-02-01T00:00:00', destaque: false },
        { label: 'Inscrições', dataHora: '2025-03-01T00:00:00', destaque: false },
        { label: 'Encerramento inscrições', dataHora: '2025-04-15T23:59:59', destaque: false },
        { label: 'Habilitação em andamento', dataHora: '2025-05-01T00:00:00', destaque: true },
        { label: 'Resultado previsto', dataHora: '2025-06-15T00:00:00', destaque: true },
      ],
    },
  ]

  const editaisMap: Record<string, string> = {}

  for (const e of editaisData) {
    const edital = await prisma.edital.upsert({
      where: { slug: e.slug },
      update: {
        cronograma: e.cronograma,
        camposFormulario: [
          { nome: 'nomeProjeto', label: 'Nome do projeto', tipo: 'text', obrigatorio: true },
          { nome: 'descricao', label: 'Descrição do projeto', tipo: 'textarea', obrigatorio: true },
          { nome: 'valorSolicitado', label: 'Valor solicitado (R$)', tipo: 'number', obrigatorio: true },
        ],
        resumo: e.resumo,
        acoesAfirmativas: e.acoesAfirmativas,
        regrasElegibilidade: e.regrasElegibilidade,
      },
      create: {
        titulo: e.titulo,
        slug: e.slug,
        ano: e.ano,
        status: e.status,
        resumo: e.resumo,
        valorTotal: e.valorTotal,
        categorias: e.categorias,
        acoesAfirmativas: e.acoesAfirmativas,
        regrasElegibilidade: e.regrasElegibilidade,
        cronograma: e.cronograma,
        camposFormulario: [
          { nome: 'nomeProjeto', label: 'Nome do projeto', tipo: 'text', obrigatorio: true },
          { nome: 'descricao', label: 'Descrição do projeto', tipo: 'textarea', obrigatorio: true },
          { nome: 'valorSolicitado', label: 'Valor solicitado (R$)', tipo: 'number', obrigatorio: true },
        ],
      },
    })
    editaisMap[e.slug] = edital.id
  }

  console.log(`✔ ${editaisData.length} editais criados`)

  // ─────────────────────────────────────────────────────────────────────────
  // Arquivos dos editais
  // ─────────────────────────────────────────────────────────────────────────

  // URLs placeholder — em produção serão substituídas por uploads reais via admin
  const PLACEHOLDER_URL = '/arquivos-indisponiveis'

  const arquivosData = [
    { editalSlug: 'pnab-2025-fomento-artes', tipo: 'PDF', titulo: 'Edital Completo — Fomento às Artes 2025', url: PLACEHOLDER_URL, acessivel: true },
    { editalSlug: 'pnab-2025-fomento-artes', tipo: 'PDF', titulo: 'Edital em versão acessível (HTML)', url: PLACEHOLDER_URL, acessivel: true },
    { editalSlug: 'pnab-2025-fomento-artes', tipo: 'MODELO', titulo: 'Modelo de Plano de Trabalho', url: PLACEHOLDER_URL, acessivel: false },
    { editalSlug: 'pnab-2025-fomento-artes', tipo: 'DECLARACAO', titulo: 'Declaração de Residência', url: PLACEHOLDER_URL, acessivel: false },
    { editalSlug: 'pnab-2025-fomento-artes', tipo: 'PLANILHA', titulo: 'Planilha Orçamentária', url: PLACEHOLDER_URL, acessivel: false },
    { editalSlug: 'pnab-2025-audiovisual', tipo: 'PDF', titulo: 'Edital Audiovisual 2025', url: PLACEHOLDER_URL, acessivel: true },
    { editalSlug: 'pnab-2025-audiovisual', tipo: 'MODELO', titulo: 'Roteiro de Pré-Produção', url: PLACEHOLDER_URL, acessivel: false },
  ]

  // Limpa arquivos existentes para evitar duplicatas em re-seeds
  const editalIds = Object.values(editaisMap)
  if (editalIds.length > 0) {
    await prisma.arquivoEdital.deleteMany({ where: { editalId: { in: editalIds } } })
  }

  let arquivosCount = 0
  for (const a of arquivosData) {
    const editalId = editaisMap[a.editalSlug]
    if (!editalId) continue
    await prisma.arquivoEdital.create({
      data: {
        editalId,
        tipo: a.tipo,
        titulo: a.titulo,
        url: a.url,
        acessivel: a.acessivel,
      },
    })
    arquivosCount++
  }

  console.log(`✔ ${arquivosCount} arquivos de editais criados`)

  // ─────────────────────────────────────────────────────────────────────────
  // FAQ — Gerais + por edital
  // ─────────────────────────────────────────────────────────────────────────

  const faqGeral = [
    { pergunta: 'O que é a PNAB?', resposta: 'A Política Nacional Aldir Blanc (PNAB) é uma política de fomento à cultura instituída pela Lei nº 14.399/2022, que destina recursos federais aos estados e municípios para apoio a projetos culturais, espaços artísticos e ações de preservação do patrimônio.' },
    { pergunta: 'Quem pode se inscrever nos editais?', resposta: 'Podem se inscrever pessoas físicas (maiores de 18 anos), microempreendedores individuais (MEI), pessoas jurídicas e coletivos culturais com domicílio comprovado em Irecê/BA, conforme as regras específicas de cada edital.' },
    { pergunta: 'Preciso ter CNPJ para me inscrever?', resposta: 'Não obrigatoriamente. Pessoas físicas podem se inscrever com CPF. No entanto, alguns editais podem ter categorias específicas para pessoas jurídicas ou MEI.' },
    { pergunta: 'Como funciona o processo de seleção?', resposta: 'O processo segue estas etapas: 1) Inscrição online pela plataforma; 2) Habilitação documental; 3) Avaliação técnica por comissão avaliadora; 4) Resultado preliminar com prazo para recursos; 5) Resultado final e convocação dos selecionados.' },
    { pergunta: 'Posso inscrever mais de um projeto?', resposta: 'Sim, desde que sejam em categorias diferentes do mesmo edital ou em editais distintos. Um mesmo proponente pode ter no máximo 2 projetos aprovados simultaneamente.' },
    { pergunta: 'Como acompanho o resultado?', resposta: 'Todos os resultados são publicados nesta plataforma e os proponentes inscritos recebem notificação por e-mail. Você também pode acompanhar pelo painel do proponente após fazer login.' },
  ]

  // Limpa apenas FAQs do seed para evitar duplicatas em re-seeds
  await prisma.faqItem.deleteMany({
    where: { id: { startsWith: 'seed-' } },
  })

  for (let i = 0; i < faqGeral.length; i++) {
    await prisma.faqItem.upsert({
      where: { id: `seed-faq-geral-${i + 1}` },
      update: {},
      create: {
        id: `seed-faq-geral-${i + 1}`,
        editalId: null,
        pergunta: faqGeral[i].pergunta,
        resposta: faqGeral[i].resposta,
        ordem: i + 1,
        publicado: true,
      },
    })
  }

  const faqEdital = [
    { pergunta: 'Quem pode se inscrever no edital de Fomento às Artes?', resposta: 'Pessoas físicas ou jurídicas com domicílio em Irecê/BA há pelo menos 2 anos, conforme regras do edital.' },
    { pergunta: 'Qual o valor máximo por projeto?', resposta: 'O valor máximo varia conforme a categoria: Música e Teatro até R$ 50 mil; Dança e Artes Visuais até R$ 40 mil; Audiovisual até R$ 60 mil; Literatura até R$ 30 mil.' },
    { pergunta: 'Como funciona o recurso?', resposta: 'Após a publicação do resultado preliminar, os proponentes têm 5 dias úteis para interpor recurso pela plataforma. A comissão analisa os recursos e publica a decisão em até 10 dias.' },
    { pergunta: 'Quais documentos são obrigatórios?', resposta: 'CPF/CNPJ, comprovante de residência atualizado, plano de trabalho, planilha orçamentária, currículo artístico e declaração de não impedimento.' },
  ]

  for (let i = 0; i < faqEdital.length; i++) {
    await prisma.faqItem.upsert({
      where: { id: `seed-faq-edital-${i + 1}` },
      update: {},
      create: {
        id: `seed-faq-edital-${i + 1}`,
        editalId: editaisMap['pnab-2025-fomento-artes'],
        pergunta: faqEdital[i].pergunta,
        resposta: faqEdital[i].resposta,
        ordem: i + 1,
        publicado: true,
      },
    })
  }

  console.log(`✔ ${faqGeral.length + faqEdital.length} itens de FAQ criados`)

  // ─────────────────────────────────────────────────────────────────────────
  // Notícias — 6 notícias variadas
  // ─────────────────────────────────────────────────────────────────────────

  const noticias = [
    {
      slug: 'edital-pnab-2025-publicado',
      titulo: 'Edital PNAB 2025 é publicado com R$ 500 mil para fomento cultural',
      imagemUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop',
      corpo: 'A Secretaria de Arte e Cultura de Irecê publicou nesta segunda-feira o Edital PNAB 2025 de Fomento às Artes, com investimento total de R$ 500 mil.\n\nO edital contempla seis categorias artísticas: Música, Dança, Teatro, Artes Visuais, Audiovisual e Literatura. Serão selecionados projetos com valores entre R$ 15 mil e R$ 60 mil, dependendo da categoria.\n\n## Ações Afirmativas\n\nO edital prevê cotas de 30% para proponentes negros, indígenas e quilombolas, além de 10% para pessoas com deficiência. Projetos realizados em comunidades rurais terão bonificação na pontuação.\n\n## Inscrições\n\nAs inscrições serão realizadas exclusivamente pela plataforma digital do Portal PNAB Irecê, de 1º de abril a 30 de junho de 2025.\n\nPara mais informações, consulte o edital completo na seção de editais do portal.',
      tags: ['PNAB', 'Edital', '2025', 'Fomento'],
      publicadoEm: new Date('2025-03-01'),
    },
    {
      slug: 'inscricoes-audiovisual-abertas',
      titulo: 'Inscrições abertas para o Edital de Audiovisual 2025',
      imagemUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=400&fit=crop',
      corpo: 'Estão abertas as inscrições para o Edital de Audiovisual 2025 — Curtas e Documentários, que vai selecionar até 8 projetos de produção audiovisual com temática cultural do sertão baiano.\n\n## Valores\n\nOs projetos selecionados receberão entre R$ 15 mil e R$ 40 mil cada, com investimento total de R$ 200 mil.\n\n## Como se inscrever\n\nAs inscrições são feitas exclusivamente pelo Portal PNAB Irecê. É necessário criar uma conta, preencher o formulário de inscrição e anexar os documentos obrigatórios.\n\nO prazo de inscrição vai até 15 de julho de 2025.',
      tags: ['Audiovisual', 'Edital', 'Inscrições'],
      publicadoEm: new Date('2025-04-15'),
    },
    {
      slug: 'oficina-elaboracao-projetos',
      titulo: 'Secretaria realiza oficina gratuita de elaboração de projetos culturais',
      imagemUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
      corpo: 'A Secretaria de Arte e Cultura de Irecê realizará no próximo sábado (20/04) uma oficina gratuita de elaboração de projetos culturais, voltada para proponentes interessados nos editais PNAB 2025.\n\n## Programação\n\nA oficina acontece das 9h às 17h no Centro Cultural de Irecê e abordará:\n\n- Como preencher o plano de trabalho\n- Elaboração de orçamento\n- Documentação necessária\n- Dúvidas frequentes sobre os editais\n\n## Inscrição\n\nAs vagas são limitadas a 40 participantes. Inscreva-se pelo e-mail cultura@irece.ba.gov.br até o dia 18/04.',
      tags: ['Oficina', 'Capacitação', 'Projetos'],
      publicadoEm: new Date('2025-04-10'),
    },
    {
      slug: 'resultado-fomento-2024',
      titulo: 'Divulgado resultado final do Edital de Fomento à Cultura 2024',
      imagemUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop',
      corpo: 'A Secretaria de Arte e Cultura divulga o resultado final do Edital PNAB 2024 — Fomento à Cultura. Foram selecionados 15 projetos culturais em quatro categorias artísticas.\n\n## Projetos selecionados\n\nOs 15 projetos contemplados somam R$ 350 mil em investimentos e incluem iniciativas nas áreas de Música (4 projetos), Dança (3), Teatro (5) e Artesanato (3).\n\n## Próximos passos\n\nOs proponentes selecionados serão convocados para assinatura do termo de compromisso a partir de 1º de setembro. A lista completa está disponível na seção de Projetos Apoiados do portal.',
      tags: ['Resultado', '2024', 'Fomento'],
      publicadoEm: new Date('2024-08-15'),
    },
    {
      slug: 'pontos-cultura-selecionados',
      titulo: '6 espaços selecionados para Rede Municipal de Pontos de Cultura',
      imagemUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=400&fit=crop',
      corpo: 'A Secretaria de Arte e Cultura de Irecê divulgou os 6 espaços culturais selecionados para integrar a Rede Municipal de Pontos de Cultura. Cada espaço receberá apoio de R$ 20 mil.\n\nOs Pontos de Cultura selecionados estão distribuídos em diferentes bairros e comunidades de Irecê, garantindo a descentralização do acesso à cultura na cidade.\n\n## Espaços selecionados\n\n- Casa do Samba de Roda — Bairro São José\n- Ateliê Cores do Sertão — Centro\n- Espaço Capoeira Raízes — Bairro da Caixa d\'Água\n- Biblioteca Comunitária Leitura Viva — Vila Esperança\n- Studio de Música Harmonia — Bairro Alto\n- Barracão Cultural Quilombo — Comunidade Quilombola de Olhos d\'Água',
      tags: ['Pontos de Cultura', 'Resultado', '2024'],
      publicadoEm: new Date('2024-10-01'),
    },
    {
      slug: 'pnab-irece-recebe-recursos-federais',
      titulo: 'Irecê recebe R$ 1,4 milhão em recursos da PNAB para fomento cultural',
      imagemUrl: 'https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=800&h=400&fit=crop',
      corpo: 'O município de Irecê recebeu a confirmação do repasse de R$ 1,4 milhão em recursos da Política Nacional Aldir Blanc (PNAB) para o biênio 2025-2026.\n\nOs recursos serão aplicados em editais públicos de fomento a projetos culturais, manutenção de espaços culturais e ações de formação artística.\n\n## Distribuição prevista\n\n- Editais de fomento: R$ 930 mil\n- Pontos de Cultura: R$ 240 mil\n- Formação cultural: R$ 130 mil\n- Patrimônio cultural: R$ 100 mil\n\nA Secretaria de Arte e Cultura já iniciou o planejamento dos editais para 2025, com previsão de publicação a partir de março.',
      tags: ['PNAB', 'Recursos', 'Federal'],
      publicadoEm: new Date('2025-01-20'),
    },
  ]

  for (const n of noticias) {
    await prisma.noticia.upsert({
      where: { slug: n.slug },
      update: { imagemUrl: n.imagemUrl },
      create: {
        titulo: n.titulo,
        slug: n.slug,
        corpo: n.corpo,
        tags: n.tags,
        imagemUrl: n.imagemUrl,
        publicado: true,
        publicadoEm: n.publicadoEm,
      },
    })
  }

  console.log(`✔ ${noticias.length} notícias criadas`)

  // ─────────────────────────────────────────────────────────────────────────
  // Manuais — 5 documentos em 3 categorias
  // ─────────────────────────────────────────────────────────────────────────

  const manuais = [
    { titulo: 'Guia do Proponente — Como se inscrever', categoria: 'Guias', url: PLACEHOLDER_URL, versao: '2.0' },
    { titulo: 'Manual de Elaboração de Projetos Culturais', categoria: 'Guias', url: PLACEHOLDER_URL, versao: '1.0' },
    { titulo: 'Manual de Prestação de Contas', categoria: 'Prestação de Contas', url: PLACEHOLDER_URL, versao: '1.2' },
    { titulo: 'Modelo de Relatório de Execução', categoria: 'Prestação de Contas', url: PLACEHOLDER_URL, versao: '1.0' },
    { titulo: 'Regimento da Comissão de Seleção', categoria: 'Documentos Institucionais', url: PLACEHOLDER_URL, versao: '1.0' },
  ]

  for (const m of manuais) {
    await prisma.manual.upsert({
      where: { id: `seed-manual-${m.titulo.slice(0, 20).replace(/\s/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-manual-${m.titulo.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`,
        titulo: m.titulo,
        categoria: m.categoria,
        url: m.url,
        versao: m.versao,
        publicado: true,
      },
    })
  }

  console.log(`✔ ${manuais.length} manuais criados`)

  // ─────────────────────────────────────────────────────────────────────────
  // Inscrições + Projetos Apoiados (edital 2024 encerrado)
  // ─────────────────────────────────────────────────────────────────────────

  const proponentes = await prisma.user.findMany({
    where: { role: UserRole.PROPONENTE },
    take: 5,
  })

  const edital2024Id = editaisMap['pnab-2024-fomento-cultura']

  if (edital2024Id && proponentes.length >= 3) {
    const inscricoesData = [
      { numero: 'PNAB-2024-001', proponenteIdx: 0, status: 'CONTEMPLADA' as const, categoria: 'Música', valor: 45000, projeto: 'Festival de Forró do Sertão', contrapartida: 'Oficina de forró para 30 jovens da comunidade' },
      { numero: 'PNAB-2024-002', proponenteIdx: 1, status: 'CONTEMPLADA' as const, categoria: 'Teatro', valor: 35000, projeto: 'Espetáculo "Raízes"', contrapartida: '3 apresentações gratuitas em escolas públicas' },
      { numero: 'PNAB-2024-003', proponenteIdx: 2, status: 'CONTEMPLADA' as const, categoria: 'Dança', valor: 28000, projeto: 'Cia. de Dança Contemporânea do Sertão', contrapartida: 'Workshop de dança para 20 participantes' },
      { numero: 'PNAB-2024-004', proponenteIdx: 3 % proponentes.length, status: 'CONTEMPLADA' as const, categoria: 'Artesanato', valor: 20000, projeto: 'Cerâmica Artística de Irecê', contrapartida: 'Exposição aberta ao público por 30 dias' },
      { numero: 'PNAB-2024-005', proponenteIdx: 4 % proponentes.length, status: 'NAO_CONTEMPLADA' as const, categoria: 'Música', valor: 0, projeto: null, contrapartida: null },
    ]

    for (const insc of inscricoesData) {
      const existing = await prisma.inscricao.findUnique({ where: { numero: insc.numero } })
      if (existing) continue

      const inscricao = await prisma.inscricao.create({
        data: {
          numero: insc.numero,
          editalId: edital2024Id,
          proponenteId: proponentes[insc.proponenteIdx].id,
          status: insc.status,
          categoria: insc.categoria,
          campos: JSON.stringify({ nomeProjeto: insc.projeto ?? 'Projeto teste' }),
          submittedAt: new Date('2024-05-15'),
        },
      })

      // Criar projeto apoiado para contempladas
      if (insc.status === 'CONTEMPLADA' && insc.valor > 0) {
        await prisma.projetoApoiado.create({
          data: {
            inscricaoId: inscricao.id,
            valorAprovado: insc.valor,
            statusExecucao: insc.numero === 'PNAB-2024-001' ? 'CONCLUIDO' : 'EM_EXECUCAO',
            contrapartida: insc.contrapartida,
            publicado: true,
          },
        })
      }
    }

    console.log(`✔ ${inscricoesData.length} inscrições + projetos apoiados criados`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tickets de exemplo
  // ─────────────────────────────────────────────────────────────────────────

  const tickets = [
    {
      protocolo: 'ATD-2025-000001',
      nomeContato: 'Maria das Graças',
      emailContato: 'maria.gracas@email.com',
      assunto: 'Dúvida sobre documentação',
      mensagem: 'Gostaria de saber se posso usar comprovante de residência no nome do cônjuge para me inscrever no edital.',
      status: 'ABERTO' as const,
    },
    {
      protocolo: 'ATD-2025-000002',
      nomeContato: 'José Almeida',
      emailContato: 'jose.almeida@email.com',
      assunto: 'Problema no upload de documentos',
      mensagem: 'Estou tentando fazer upload do plano de trabalho mas o sistema apresenta erro. O arquivo tem 5MB em PDF.',
      status: 'EM_ATENDIMENTO' as const,
    },
  ]

  for (const t of tickets) {
    const existing = await prisma.ticket.findUnique({ where: { protocolo: t.protocolo } })
    if (existing) continue

    await prisma.ticket.create({
      data: {
        protocolo: t.protocolo,
        nomeContato: t.nomeContato,
        emailContato: t.emailContato,
        assunto: t.assunto,
        mensagem: t.mensagem,
        status: t.status,
        historico: [],
      },
    })
  }

  console.log(`✔ ${tickets.length} tickets de exemplo criados`)

  // ─────────────────────────────────────────────────────────────────────────
  // Resumo
  // ─────────────────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════')
  console.log('  Seed concluído! Credenciais de teste:')
  console.log('════════════════════════════════════════════')
  console.log(`  Senha para todos: ${DEFAULT_PASSWORD}`)
  console.log('')
  console.log('  ADMIN          → admin@pnab.irece.ba.gov.br')
  console.log('  ATENDIMENTO    → atendimento@pnab.irece.ba.gov.br')
  console.log('  HABILITADOR    → habilitador@pnab.irece.ba.gov.br')
  console.log('  AVALIADOR      → avaliador@pnab.irece.ba.gov.br')
  console.log('  PROPONENTE PF  → proponente@teste.com')
  console.log('  PROPONENTE MEI → proponente.mei@teste.com')
  console.log('  + 4 proponentes adicionais')
  console.log('')
  console.log('  Dados criados:')
  console.log(`    ${editaisData.length} editais (abertos, publicados, encerrados)`)
  console.log(`    ${noticias.length} notícias`)
  console.log(`    ${manuais.length} manuais`)
  console.log(`    ${faqGeral.length + faqEdital.length} FAQs`)
  console.log('    Inscrições + projetos apoiados')
  console.log('    Tickets de atendimento')
  console.log('════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
