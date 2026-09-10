import { PrismaClient, UserRole, TipoProponente, type Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Teste@123'
const EDITAL_SLUG = 'festival-arte-cultura-irece-centenario-2026'

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

interface EquipeMembro { nome: string; funcao: string; cpf_cnpj: string; mini_curriculo: string }
interface Atividade { atividade: string; etapa: string; descricao: string; inicio: string; fim: string }
interface ItemOrcamento {
  descricao_item: string
  justificativa: string
  unidade_medida: string
  valor_unitario: number
  quantidade: number
  valor_total: number
  referencia_preco: string
}

function buildCampos(input: {
  nomeCompleto: string
  telefone: string
  email: string
  nomeProjeto: string
  descricaoProjeto: string
  metas: string
  perfilPublico: string
  publicoPrioritario: string[]
  objetivos: string
  localExecucao: string
  inicio: string
  fim: string
  equipe: EquipeMembro[]
  cronograma: Atividade[]
  divulgacao: string
  orcamento: ItemOrcamento[]
}) {
  return {
    nome_completo: input.nomeCompleto,
    telefone_contato: input.telefone,
    email_contato: input.email,
    nome_projeto: input.nomeProjeto,
    descricao_projeto: input.descricaoProjeto,
    metas: input.metas,
    perfil_publico: input.perfilPublico,
    publico_prioritario: input.publicoPrioritario,
    objetivos: input.objetivos,
    acessibilidade_arquitetonica: ['rotas acessíveis, com espaço de manobra para cadeira de rodas; piso tátil'],
    acessibilidade_comunicacional: ['a Língua Brasileira de Sinais - Libras'],
    acessibilidade_atitudinal: ['capacitação de equipes atuantes nos projetos culturais'],
    acessibilidade_detalhamento: 'Intérprete de Libras contratado para as apresentações públicas e material de divulgação com audiodescrição das peças visuais.',
    local_execucao: input.localExecucao,
    data_inicio_execucao: input.inicio,
    data_fim_execucao: input.fim,
    equipe: input.equipe,
    cronograma_execucao: input.cronograma,
    estrategia_divulgacao: input.divulgacao,
    outras_fontes: ['Não, o projeto não possui outras fontes de recursos financeiros'],
    detalhamento_outras_fontes: '',
    venda_produtos: 'Não haverá venda de produtos ou cobrança de ingressos — todas as atividades serão gratuitas e abertas ao público.',
    planilha_orcamentaria: input.orcamento,
  }
}

async function main() {
  const passwordHash = await hash(DEFAULT_PASSWORD, 12)

  console.log('=== Enriquecendo ambiente de demonstração do Festival de Arte e Cultura ===\n')

  const edital = await prisma.edital.findUnique({ where: { slug: EDITAL_SLUG } })
  if (!edital) throw new Error(`Edital ${EDITAL_SLUG} não encontrado — rode antes prisma/seed-festival-centenario.ts`)

  if (edital.status !== 'AVALIACAO') {
    await prisma.edital.update({ where: { id: edital.id }, data: { status: 'AVALIACAO' } })
    console.log('✔ Edital movido para a fase AVALIACAO')
  }

  // 1. Avaliadores — reaproveita os dois já usados no edital de Mestres e Mestras
  // (mesma equipe de avaliação atende os dois editais, cenário real) e soma mais dois.
  const avaliadorAna = await prisma.user.upsert({
    where: { email: 'avaliador@pnab.irece.ba.gov.br' },
    update: { role: UserRole.AVALIADOR, ativo: true },
    create: { email: 'avaliador@pnab.irece.ba.gov.br', password: passwordHash, role: UserRole.AVALIADOR, nome: 'Avaliadora Ana Ferreira', cpfCnpj: '00000000004', ativo: true },
  })
  const avaliadorBruno = await prisma.user.upsert({
    where: { email: 'avaliador2@pnab.irece.ba.gov.br' },
    update: { role: UserRole.AVALIADOR, ativo: true },
    create: { email: 'avaliador2@pnab.irece.ba.gov.br', password: passwordHash, role: UserRole.AVALIADOR, nome: 'Avaliador Bruno Rocha', cpfCnpj: '00000000008', ativo: true },
  })
  const avaliadoraCarla = await prisma.user.upsert({
    where: { email: 'avaliador3@pnab.irece.ba.gov.br' },
    update: { role: UserRole.AVALIADOR, nome: 'Avaliadora Carla Menezes', ativo: true },
    create: { email: 'avaliador3@pnab.irece.ba.gov.br', password: passwordHash, role: UserRole.AVALIADOR, nome: 'Avaliadora Carla Menezes', cpfCnpj: '00000000012', ativo: true },
  })
  const avaliadorDiego = await prisma.user.upsert({
    where: { email: 'avaliador4@pnab.irece.ba.gov.br' },
    update: { role: UserRole.AVALIADOR, nome: 'Avaliador Diego Andrade', ativo: true },
    create: { email: 'avaliador4@pnab.irece.ba.gov.br', password: passwordHash, role: UserRole.AVALIADOR, nome: 'Avaliador Diego Andrade', cpfCnpj: '00000000016', ativo: true },
  })

  for (const av of [avaliadorAna, avaliadorBruno, avaliadoraCarla, avaliadorDiego]) {
    await prisma.editalMembro.upsert({
      where: { editalId_userId_funcao: { editalId: edital.id, userId: av.id, funcao: 'AVALIADOR' } },
      update: {},
      create: { editalId: edital.id, userId: av.id, funcao: 'AVALIADOR' },
    })
  }
  console.log('✔ 4 avaliadores vinculados ao edital (avaliador@ a avaliador4@pnab.irece.ba.gov.br)')

  // 2. Enriquecer os proponentes já existentes (estavam com o formulário vazio)
  const existentes = await prisma.inscricao.findMany({
    where: { editalId: edital.id },
    select: { id: true, numero: true, categoria: true, proponente: { select: { nome: true, email: true, tipoProponente: true } } },
  })

  const camposPorNumero: Record<string, ReturnType<typeof buildCampos>> = {
    'PNAB-2026-0004': buildCampos({
      nomeCompleto: 'Coletivo Cultural Raízes do Sertão',
      telefone: '(74) 99777-5678',
      email: 'coletivo.raizes@teste.com',
      nomeProjeto: 'Roda Viva — Música de Raiz do Sertão de Irecê',
      descricaoProjeto: 'Ciclo de 4 apresentações musicais autorais reunindo os ritmos tradicionais do sertão baiano (forró de raiz, coco de roda e xote) com composições inéditas do coletivo, celebrando os 100 anos de Irecê com um repertório que dialoga o tradicional e o contemporâneo.',
      metas: 'Realizar 4 apresentações musicais públicas e gratuitas; produzir 1 EP com 6 faixas autorais; oferecer 2 oficinas gratuitas de percussão tradicional pra jovens da rede pública.',
      perfilPublico: 'Público geral de Irecê e região, com atenção especial a moradores de bairros periféricos e estudantes da rede pública municipal.',
      publicoPrioritario: ['Não é voltada especificamente para um perfil, é aberta para todos'],
      objetivos: 'Valorizar a música tradicional do sertão de Irecê; fortalecer a identidade cultural do centenário da cidade; formar novos músicos através das oficinas; ampliar o acesso à cultura musical de qualidade gratuita.',
      localExecucao: 'Praça da Matriz de Irecê e Centro Cultural Municipal',
      inicio: '2026-11-05',
      fim: '2026-11-15',
      equipe: [
        { nome: 'José Raimundo Filho', funcao: 'Regente e diretor musical', cpf_cnpj: '111.222.333-44', mini_curriculo: '20 anos de atuação como músico e regente em grupos tradicionais de Irecê.' },
        { nome: 'Maria Aparecida Souza', funcao: 'Produtora cultural', cpf_cnpj: '222.333.444-55', mini_curriculo: 'Produtora de eventos culturais no sertão há 12 anos, com passagem por 3 editais de fomento.' },
      ],
      cronograma: [
        { atividade: 'Pré-produção', etapa: 'Ensaios e arranjos', descricao: 'Ensaios semanais e finalização dos arranjos musicais das 4 apresentações.', inicio: '2026-11-05', fim: '2026-11-08' },
        { atividade: 'Oficinas', etapa: 'Formação', descricao: 'Duas oficinas gratuitas de percussão tradicional para jovens da rede pública.', inicio: '2026-11-09', fim: '2026-11-10' },
        { atividade: 'Apresentações', etapa: 'Execução', descricao: 'Quatro apresentações públicas na Praça da Matriz e no Centro Cultural.', inicio: '2026-11-11', fim: '2026-11-15' },
      ],
      divulgacao: 'Divulgação via redes sociais do coletivo, rádio local FM Sertão, cartazes impressos distribuídos no comércio do centro e parceria com a Secretaria de Cultura para inclusão na agenda oficial do centenário.',
      orcamento: [
        { descricao_item: 'Cachê de músicos (5 integrantes, 4 apresentações)', justificativa: 'Pagamento da equipe musical pelas apresentações e ensaios.', unidade_medida: 'Serviço', valor_unitario: 800, quantidade: 5, valor_total: 4000, referencia_preco: '3 orçamentos de cachês regionais' },
        { descricao_item: 'Sonorização e iluminação', justificativa: 'Estrutura técnica para as apresentações ao ar livre.', unidade_medida: 'Diária', valor_unitario: 900, quantidade: 4, valor_total: 3600, referencia_preco: 'Orçamento de fornecedor local' },
        { descricao_item: 'Gravação e produção do EP', justificativa: 'Registro fonográfico das 6 faixas autorais.', unidade_medida: 'Serviço', valor_unitario: 2400, quantidade: 1, valor_total: 2400, referencia_preco: 'Orçamento de estúdio em Irecê' },
      ],
    }),
    'PNAB-2026-0005': buildCampos({
      nomeCompleto: 'Marcos Oliveira',
      telefone: '(74) 99888-2233',
      email: 'marcos.teatro@teste.com',
      nomeProjeto: 'Cem Anos em Cena — Teatro sobre a História de Irecê',
      descricaoProjeto: 'Montagem teatral original que narra a fundação e a trajetória centenária de Irecê através de 6 quadros dramáticos, com elenco majoritariamente formado por atores amadores da cidade, culminando em 3 apresentações públicas no mês do centenário.',
      metas: 'Montar e apresentar 1 espetáculo teatral inédito em 3 sessões públicas; formar 8 atores amadores locais através de oficinas de interpretação; registrar em vídeo a montagem completa.',
      perfilPublico: 'Famílias e estudantes de Irecê, com sessões pensadas para acessibilidade a idosos e pessoas com deficiência.',
      publicoPrioritario: ['Pessoas em sofrimento físico e/ou psíquico'],
      objetivos: 'Resgatar e dramatizar a memória histórica de Irecê; formar novos atores na cidade; oferecer teatro de qualidade gratuito à população; deixar um registro audiovisual permanente da montagem.',
      localExecucao: 'Teatro Municipal de Irecê',
      inicio: '2026-11-01',
      fim: '2026-11-20',
      equipe: [
        { nome: 'Marcos Oliveira', funcao: 'Dramaturgo e diretor', cpf_cnpj: '333.444.555-66', mini_curriculo: '15 anos de atuação em teatro amador e diretor de 4 montagens municipais anteriores.' },
        { nome: 'Fernanda Costa Lima', funcao: 'Figurinista e cenógrafa', cpf_cnpj: '444.555.666-77', mini_curriculo: 'Artista visual com experiência em produção de figurinos para grupos teatrais da região.' },
      ],
      cronograma: [
        { atividade: 'Oficinas de formação', etapa: 'Preparação de elenco', descricao: 'Oficinas de interpretação para os 8 atores amadores selecionados.', inicio: '2026-11-01', fim: '2026-11-08' },
        { atividade: 'Ensaios gerais', etapa: 'Montagem', descricao: 'Ensaios técnicos e gerais no Teatro Municipal.', inicio: '2026-11-09', fim: '2026-11-15' },
        { atividade: 'Temporada', etapa: 'Execução', descricao: 'Três sessões públicas abertas, com registro audiovisual completo.', inicio: '2026-11-18', fim: '2026-11-20' },
      ],
      divulgacao: 'Cartazes no comércio local, parceria com as escolas municipais para distribuição de ingressos gratuitos a estudantes, divulgação em rádio e Instagram do projeto.',
      orcamento: [
        { descricao_item: 'Figurinos e cenografia', justificativa: 'Confecção de figurinos de época para os 6 quadros históricos.', unidade_medida: 'Serviço', valor_unitario: 3500, quantidade: 1, valor_total: 3500, referencia_preco: 'Orçamento de ateliê local' },
        { descricao_item: 'Cachê de elenco e equipe técnica', justificativa: 'Pagamento aos 8 atores e 3 técnicos durante o período de montagem.', unidade_medida: 'Serviço', valor_unitario: 600, quantidade: 11, valor_total: 6600, referencia_preco: '3 orçamentos de cachês para produções amadoras' },
        { descricao_item: 'Registro audiovisual', justificativa: 'Gravação profissional das 3 sessões para acervo público.', unidade_medida: 'Serviço', valor_unitario: 1900, quantidade: 1, valor_total: 1900, referencia_preco: 'Orçamento de produtora audiovisual de Irecê' },
      ],
    }),
    'PNAB-2026-0006': buildCampos({
      nomeCompleto: 'Carlos Silva',
      telefone: '(74) 99666-1122',
      email: 'proponente@teste.com',
      nomeProjeto: 'Reisado do Centenário — Tradição Viva de Irecê',
      descricaoProjeto: 'Cortejo e apresentação do Reisado tradicional de Irecê, reunindo 3 grupos de folguedo popular da cidade numa grande celebração das culturas populares no encerramento das festividades do centenário, com registro dos versos e coreografias tradicionais.',
      metas: 'Reunir 3 grupos de Reisado num cortejo único pelo centro histórico; realizar 1 grande apresentação na Praça da Matriz; produzir cartilha de registro dos versos e trajes tradicionais.',
      perfilPublico: 'Comunidade de Irecê em geral, com foco em fortalecer a autoestima das comunidades tradicionais e populares que mantêm viva essa manifestação.',
      publicoPrioritario: ['Povos e comunidades tradicionais'],
      objetivos: 'Preservar e difundir a tradição do Reisado em Irecê; unir os grupos de folguedo popular da cidade; registrar em cartilha o patrimônio imaterial da manifestação; fortalecer a autoestima das comunidades tradicionais.',
      localExecucao: 'Centro histórico e Praça da Matriz de Irecê',
      inicio: '2026-11-12',
      fim: '2026-11-14',
      equipe: [
        { nome: 'Carlos Silva', funcao: 'Coordenador geral e mestre de Reisado', cpf_cnpj: '555.666.777-88', mini_curriculo: 'Mestre de Reisado há 25 anos, liderança comunitária reconhecida em Irecê.' },
        { nome: 'Antônia Ferreira dos Santos', funcao: 'Pesquisadora e produtora da cartilha', cpf_cnpj: '666.777.888-99', mini_curriculo: 'Pesquisadora de cultura popular, autora de 2 publicações sobre tradições do sertão baiano.' },
      ],
      cronograma: [
        { atividade: 'Articulação', etapa: 'Preparação', descricao: 'Reunião e ensaios conjuntos dos 3 grupos de Reisado participantes.', inicio: '2026-11-12', fim: '2026-11-12' },
        { atividade: 'Cortejo', etapa: 'Execução', descricao: 'Cortejo dos grupos pelo centro histórico de Irecê.', inicio: '2026-11-13', fim: '2026-11-13' },
        { atividade: 'Apresentação final', etapa: 'Execução', descricao: 'Grande apresentação conjunta na Praça da Matriz com lançamento da cartilha.', inicio: '2026-11-14', fim: '2026-11-14' },
      ],
      divulgacao: 'Divulgação boca a boca nas comunidades tradicionais, rádio comunitária, cartazes e parceria com a Secretaria de Cultura para inclusão na programação oficial do centenário.',
      orcamento: [
        { descricao_item: 'Indumentária e adereços tradicionais', justificativa: 'Confecção e reparo de trajes dos 3 grupos participantes.', unidade_medida: 'Serviço', valor_unitario: 2800, quantidade: 1, valor_total: 2800, referencia_preco: 'Orçamento de costureiras da comunidade' },
        { descricao_item: 'Alimentação dos grupos participantes', justificativa: 'Alimentação durante os 3 dias de atividades para cerca de 40 integrantes.', unidade_medida: 'Diária', valor_unitario: 25, quantidade: 120, valor_total: 3000, referencia_preco: 'Orçamento de fornecedor de marmitas local' },
        { descricao_item: 'Produção e impressão da cartilha', justificativa: 'Registro e publicação de 500 exemplares da cartilha de versos e tradições.', unidade_medida: 'Serviço', valor_unitario: 2200, quantidade: 1, valor_total: 2200, referencia_preco: 'Orçamento de gráfica local' },
      ],
    }),
  }

  for (const insc of existentes) {
    const campos = camposPorNumero[insc.numero]
    if (!campos) continue
    await prisma.inscricao.update({ where: { id: insc.id }, data: { campos: toJson(campos) } })
    console.log(`  ✔ Formulário preenchido — ${insc.numero} (${insc.proponente.nome})`)
  }

  // 3. Novos proponentes — mais volume e mais categorias pra testar o avaliador
  let inscricaoCount = 7
  const novos = [
    {
      email: 'danca.ventos@teste.com', nome: 'Grupo de Dança Ventos do Sertão', tipo: TipoProponente.COLETIVO,
      categoria: 'Dança I', cpfCnpj: '77788899900',
      campos: buildCampos({
        nomeCompleto: 'Grupo de Dança Ventos do Sertão', telefone: '(74) 99555-3344', email: 'danca.ventos@teste.com',
        nomeProjeto: 'Sertão em Movimento — Espetáculo de Dança Contemporânea',
        descricaoProjeto: 'Espetáculo de dança contemporânea que dialoga com elementos do imaginário sertanejo — a seca, a chuva, a colheita — através de 6 bailarinos locais, com 2 apresentações públicas gratuitas no centro de Irecê.',
        metas: 'Montar e apresentar 1 espetáculo de dança contemporânea em 2 sessões públicas; oferecer 3 oficinas gratuitas de dança para crianças e adolescentes da rede pública.',
        perfilPublico: 'Crianças, adolescentes e famílias de Irecê, com prioridade para estudantes da rede pública municipal.',
        publicoPrioritario: ['Crianças'],
        objetivos: 'Ampliar o acesso à dança contemporânea em Irecê; formar novos bailarinos através das oficinas; valorizar o imaginário sertanejo através da arte do corpo.',
        localExecucao: 'Centro Cultural Municipal de Irecê',
        inicio: '2026-11-06', fim: '2026-11-16',
        equipe: [
          { nome: 'Juliana Ramos Pereira', funcao: 'Coreógrafa e diretora artística', cpf_cnpj: '777.888.999-00', mini_curriculo: 'Bailarina e coreógrafa com 10 anos de formação em dança contemporânea.' },
          { nome: 'Rodrigo Almeida Santos', funcao: 'Produtor e assistente de coreografia', cpf_cnpj: '888.999.000-11', mini_curriculo: 'Produtor cultural com 3 projetos de dança executados em Irecê.' },
        ],
        cronograma: [
          { atividade: 'Oficinas', etapa: 'Formação', descricao: 'Três oficinas gratuitas de dança para crianças e adolescentes.', inicio: '2026-11-06', fim: '2026-11-09' },
          { atividade: 'Ensaios', etapa: 'Montagem', descricao: 'Ensaios técnicos do espetáculo com os 6 bailarinos.', inicio: '2026-11-10', fim: '2026-11-14' },
          { atividade: 'Apresentações', etapa: 'Execução', descricao: 'Duas sessões públicas gratuitas no Centro Cultural.', inicio: '2026-11-15', fim: '2026-11-16' },
        ],
        divulgacao: 'Divulgação em redes sociais, parceria com escolas municipais e cartazes no comércio local.',
        orcamento: [
          { descricao_item: 'Cachê dos bailarinos', justificativa: 'Pagamento aos 6 bailarinos pelo período de ensaios e apresentações.', unidade_medida: 'Serviço', valor_unitario: 700, quantidade: 6, valor_total: 4200, referencia_preco: 'Orçamento de cachês regionais de dança' },
          { descricao_item: 'Figurino e trilha sonora', justificativa: 'Confecção de figurinos e produção da trilha sonora original.', unidade_medida: 'Serviço', valor_unitario: 2600, quantidade: 1, valor_total: 2600, referencia_preco: 'Orçamento de ateliê e produtor musical local' },
        ],
      }),
    },
    {
      email: 'cineclube.tela@teste.com', nome: 'Cineclube Tela do Sertão', tipo: TipoProponente.PJ,
      categoria: 'Audiovisual/Cinema', cpfCnpj: '12345678000199',
      campos: buildCampos({
        nomeCompleto: 'Cineclube Tela do Sertão', telefone: '(74) 99444-5566', email: 'cineclube.tela@teste.com',
        nomeProjeto: 'Sertão em Curtas — Mostra e Oficina de Cinema do Centenário',
        descricaoProjeto: 'Mostra de curtas-metragens produzidos por cineastas de Irecê e região, precedida de uma oficina gratuita de audiovisual para jovens, celebrando 100 anos de histórias contadas pela cidade através das lentes de seus próprios moradores.',
        metas: 'Produzir 3 curtas-metragens inéditos com jovens da oficina; realizar 1 mostra pública com sessão de debate; disponibilizar os curtas em plataforma digital aberta.',
        perfilPublico: 'Jovens de 15 a 24 anos interessados em audiovisual e público geral de Irecê na sessão de exibição.',
        publicoPrioritario: ['Não é voltada especificamente para um perfil, é aberta para todos'],
        objetivos: 'Formar novos realizadores audiovisuais em Irecê; produzir e exibir narrativas locais autênticas; deixar um acervo audiovisual permanente sobre o centenário da cidade.',
        localExecucao: 'Centro Cultural Municipal e Praça de Irecê',
        inicio: '2026-10-20', fim: '2026-11-18',
        equipe: [
          { nome: 'Paulo Henrique Souza', funcao: 'Diretor e ministrante da oficina', cpf_cnpj: '999.000.111-22', mini_curriculo: 'Cineasta formado, com 2 curtas exibidos em festivais regionais.' },
          { nome: 'Camila Rodrigues Nunes', funcao: 'Produtora executiva', cpf_cnpj: '000.111.222-33', mini_curriculo: 'Produtora audiovisual com experiência em 4 editais de fomento à cultura.' },
        ],
        cronograma: [
          { atividade: 'Oficina de audiovisual', etapa: 'Formação', descricao: 'Oficina gratuita de roteiro e produção audiovisual para 15 jovens.', inicio: '2026-10-20', fim: '2026-10-31' },
          { atividade: 'Produção dos curtas', etapa: 'Realização', descricao: 'Filmagem e edição dos 3 curtas-metragens produzidos na oficina.', inicio: '2026-11-01', fim: '2026-11-14' },
          { atividade: 'Mostra pública', etapa: 'Execução', descricao: 'Sessão de exibição pública seguida de debate com os realizadores.', inicio: '2026-11-18', fim: '2026-11-18' },
        ],
        divulgacao: 'Divulgação em redes sociais, parceria com escolas para inscrição na oficina e cartazes no centro da cidade.',
        orcamento: [
          { descricao_item: 'Equipamento de filmagem (locação)', justificativa: 'Locação de câmeras e equipamento de som para a produção dos curtas.', unidade_medida: 'Diária', valor_unitario: 450, quantidade: 10, valor_total: 4500, referencia_preco: 'Orçamento de locadora audiovisual regional' },
          { descricao_item: 'Cachê de ministrante e equipe técnica', justificativa: 'Pagamento do ministrante da oficina e da equipe de produção.', unidade_medida: 'Serviço', valor_unitario: 1500, quantidade: 2, valor_total: 3000, referencia_preco: '3 orçamentos de profissionais audiovisuais' },
        ],
      }),
    },
    {
      email: 'atelie.cores@teste.com', nome: 'Ateliê Cores de Irecê', tipo: TipoProponente.MEI,
      categoria: 'Arte Visual/Exposição', cpfCnpj: '98765432000188',
      campos: buildCampos({
        nomeCompleto: 'Ateliê Cores de Irecê', telefone: '(74) 99333-4455', email: 'atelie.cores@teste.com',
        nomeProjeto: '100 Olhares — Exposição Coletiva de Artes Visuais',
        descricaoProjeto: 'Exposição coletiva reunindo 12 artistas visuais de Irecê em torno do tema "100 Olhares sobre a cidade", com obras em pintura, fotografia e escultura, acompanhada de visitas guiadas gratuitas para escolas.',
        metas: 'Montar 1 exposição coletiva com 12 artistas locais; realizar 5 visitas guiadas gratuitas para escolas municipais; produzir catálogo digital da exposição.',
        perfilPublico: 'Público geral de Irecê e estudantes da rede pública municipal, através das visitas guiadas.',
        publicoPrioritario: ['Não é voltada especificamente para um perfil, é aberta para todos'],
        objetivos: 'Dar visibilidade à produção visual contemporânea de Irecê; aproximar estudantes da rede pública da arte visual; celebrar o centenário através de múltiplos olhares artísticos.',
        localExecucao: 'Centro Cultural Municipal de Irecê',
        inicio: '2026-11-03', fim: '2026-11-30',
        equipe: [
          { nome: 'Beatriz Andrade Lima', funcao: 'Curadora e artista', cpf_cnpj: '111.000.222-33', mini_curriculo: 'Artista visual e curadora com 3 exposições coletivas realizadas em Irecê.' },
          { nome: 'Tiago Ferreira Mota', funcao: 'Produtor e educador das visitas guiadas', cpf_cnpj: '222.111.333-44', mini_curriculo: 'Educador com experiência em mediação cultural em espaços expositivos.' },
        ],
        cronograma: [
          { atividade: 'Montagem', etapa: 'Pré-produção', descricao: 'Recebimento e montagem das obras dos 12 artistas participantes.', inicio: '2026-11-03', fim: '2026-11-05' },
          { atividade: 'Exposição aberta', etapa: 'Execução', descricao: 'Exposição aberta ao público com visitação livre.', inicio: '2026-11-06', fim: '2026-11-30' },
          { atividade: 'Visitas guiadas', etapa: 'Mediação', descricao: 'Cinco visitas guiadas gratuitas para turmas de escolas municipais.', inicio: '2026-11-10', fim: '2026-11-25' },
        ],
        divulgacao: 'Divulgação em redes sociais, convite formal às escolas municipais e cartazes no comércio do centro.',
        orcamento: [
          { descricao_item: 'Montagem expográfica e sinalização', justificativa: 'Estrutura de suportes, iluminação e sinalização das obras expostas.', unidade_medida: 'Serviço', valor_unitario: 3200, quantidade: 1, valor_total: 3200, referencia_preco: 'Orçamento de marcenaria e montagem local' },
          { descricao_item: 'Catálogo digital da exposição', justificativa: 'Produção e diagramação do catálogo digital com as 12 obras.', unidade_medida: 'Serviço', valor_unitario: 1800, quantidade: 1, valor_total: 1800, referencia_preco: 'Orçamento de designer gráfico local' },
        ],
      }),
    },
    {
      email: 'sarau.praca@teste.com', nome: 'Sarau da Praça', tipo: TipoProponente.PF,
      categoria: 'Poesia/Sarau', cpfCnpj: '33322211100',
      campos: buildCampos({
        nomeCompleto: 'Luciana Barbosa Reis', telefone: '(74) 99222-6677', email: 'sarau.praca@teste.com',
        nomeProjeto: 'Versos do Centenário — Sarau Itinerante de Irecê',
        descricaoProjeto: 'Sarau itinerante que percorre 3 bairros de Irecê com poesia falada, cordel e música, valorizando poetas locais e a tradição oral do sertão, com uma última edição especial na Praça da Matriz celebrando o centenário.',
        metas: 'Realizar 4 edições do sarau em bairros diferentes; publicar coletânea digital com os poemas apresentados; revelar novos poetas locais através de inscrições abertas.',
        perfilPublico: 'Moradores dos bairros periféricos de Irecê e amantes da poesia falada em geral.',
        publicoPrioritario: ['Pessoas em situação de pobreza'],
        objetivos: 'Descentralizar o acesso à cultura literária em Irecê; valorizar poetas e cordelistas locais; fortalecer a tradição oral do sertão; publicar registro da produção poética da cidade.',
        localExecucao: 'Bairros Novo Horizonte, Baixão e Recanto dos Pássaros, com encerramento na Praça da Matriz',
        inicio: '2026-11-04', fim: '2026-11-19',
        equipe: [
          { nome: 'Luciana Barbosa Reis', funcao: 'Idealizadora e mediadora do sarau', cpf_cnpj: '333.222.111-00', mini_curriculo: 'Poeta e produtora cultural, organizadora de saraus independentes em Irecê há 6 anos.' },
        ],
        cronograma: [
          { atividade: 'Sarau — Novo Horizonte', etapa: 'Execução', descricao: 'Primeira edição do sarau itinerante no bairro Novo Horizonte.', inicio: '2026-11-04', fim: '2026-11-04' },
          { atividade: 'Sarau — Baixão e Recanto dos Pássaros', etapa: 'Execução', descricao: 'Segunda e terceira edições nos bairros Baixão e Recanto dos Pássaros.', inicio: '2026-11-11', fim: '2026-11-12' },
          { atividade: 'Sarau de encerramento', etapa: 'Execução', descricao: 'Edição especial de encerramento na Praça da Matriz, com publicação da coletânea.', inicio: '2026-11-19', fim: '2026-11-19' },
        ],
        divulgacao: 'Divulgação boca a boca nas associações de bairro, redes sociais e parceria com rádio comunitária.',
        orcamento: [
          { descricao_item: 'Estrutura de som itinerante', justificativa: 'Locação de sonorização portátil para as 4 edições em bairros diferentes.', unidade_medida: 'Diária', valor_unitario: 350, quantidade: 4, valor_total: 1400, referencia_preco: 'Orçamento de locadora de som local' },
          { descricao_item: 'Diagramação e publicação da coletânea', justificativa: 'Produção da coletânea digital com os poemas apresentados no sarau.', unidade_medida: 'Serviço', valor_unitario: 900, quantidade: 1, valor_total: 900, referencia_preco: 'Orçamento de designer gráfico independente' },
        ],
      }),
    },
  ]

  for (const p of novos) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { nome: p.nome, role: UserRole.PROPONENTE, tipoProponente: p.tipo, ativo: true },
      create: { email: p.email, password: passwordHash, nome: p.nome, role: UserRole.PROPONENTE, tipoProponente: p.tipo, cpfCnpj: p.cpfCnpj, ativo: true },
    })

    const numero = `PNAB-2026-${String(inscricaoCount).padStart(4, '0')}`
    inscricaoCount++

    const jaExiste = await prisma.inscricao.findFirst({ where: { editalId: edital.id, proponenteId: user.id } })
    const inscricao = jaExiste ?? await prisma.inscricao.create({
      data: {
        numero,
        editalId: edital.id,
        proponenteId: user.id,
        status: 'HABILITADA',
        categoria: p.categoria,
        campos: toJson(p.campos),
        submittedAt: new Date('2026-09-01T10:00:00Z'),
        resultadoLiberadoEm: new Date('2026-09-15T10:00:00Z'),
      },
    })
    console.log(`  ✔ ${jaExiste ? 'Já existia' : 'Criado'} — ${inscricao.numero} — ${p.nome} (${p.categoria})`)
  }

  // 4. Distribuir avaliações entre os 4 avaliadores, em estados variados
  const todas = await prisma.inscricao.findMany({
    where: { editalId: edital.id, status: { in: ['HABILITADA', 'EM_AVALIACAO'] } },
    orderBy: { numero: 'asc' },
  })

  const notasBloco1Altas = [
    { criterio: 'A) Qualidade do Projeto', nota: 27, peso: 30 },
    { criterio: 'B) Coerência da planilha orçamentária e do cronograma de execução', nota: 18, peso: 20 },
    { criterio: 'C) Análise curricular do proponente e da ficha técnica', nota: 17, peso: 20 },
    { criterio: 'D) Relevância da ação proposta para o cenário cultural de Irecê', nota: 19, peso: 20 },
    { criterio: 'E) Coerência do Plano de Divulgação', nota: 9, peso: 10 },
  ]
  const notasBloco1Medias = [
    { criterio: 'A) Qualidade do Projeto', nota: 20, peso: 30 },
    { criterio: 'B) Coerência da planilha orçamentária e do cronograma de execução', nota: 14, peso: 20 },
    { criterio: 'C) Análise curricular do proponente e da ficha técnica', nota: 13, peso: 20 },
    { criterio: 'D) Relevância da ação proposta para o cenário cultural de Irecê', nota: 14, peso: 20 },
    { criterio: 'E) Coerência do Plano de Divulgação', nota: 6, peso: 10 },
  ]
  const bonusNenhum = [
    { criterio: 'Bonificação — Gênero feminino ou LGBTQIA+', nota: 0, peso: 5 },
    { criterio: 'Bonificação — Agente cultural negro(a) ou indígena', nota: 0, peso: 5 },
    { criterio: 'Bonificação — Pessoa com deficiência', nota: 0, peso: 5 },
  ]
  const bonusDois = [
    { criterio: 'Bonificação — Gênero feminino ou LGBTQIA+', nota: 5, peso: 5 },
    { criterio: 'Bonificação — Agente cultural negro(a) ou indígena', nota: 5, peso: 5 },
    { criterio: 'Bonificação — Pessoa com deficiência', nota: 0, peso: 5 },
  ]

  // notaTotal = (soma bloco1 / 10) + (soma bonus / 10) — mesma fórmula configurada no edital
  const somaBloco1 = (notas: typeof notasBloco1Altas) => notas.reduce((acc, n) => acc + n.nota, 0)
  const somaBonus = (notas: typeof bonusNenhum) => notas.reduce((acc, n) => acc + n.nota, 0)
  const calcularTotal = (b1: typeof notasBloco1Altas, b2: typeof bonusNenhum) =>
    Number((somaBloco1(b1) / 10 + somaBonus(b2) / 10).toFixed(2))

  const cenarios: Array<{
    numero: string
    avaliador: typeof avaliadorAna
    estado: 'aguardando' | 'rascunho' | 'finalizada'
    notas?: typeof notasBloco1Altas
    bonus?: typeof bonusNenhum
    parecer?: string
  }> = [
    { numero: 'PNAB-2026-0004', avaliador: avaliadorAna, estado: 'rascunho' }, // mantém o rascunho já demonstrado com nota 22/30
    { numero: 'PNAB-2026-0005', avaliador: avaliadorBruno, estado: 'finalizada', notas: notasBloco1Altas, bonus: bonusDois, parecer: 'Montagem teatral bem estruturada, com proposta clara de resgate histórico e forte componente formativo através das oficinas. Planilha orçamentária coerente com o escopo. Recomendo aprovação.' },
    { numero: 'PNAB-2026-0006', avaliador: avaliadoraCarla, estado: 'finalizada', notas: notasBloco1Medias, bonus: bonusNenhum, parecer: 'Projeto relevante de preservação cultural, mas o cronograma apresenta poucos detalhes sobre a articulação entre os 3 grupos de Reisado. Planilha orçamentária está adequada.' },
    { numero: 'PNAB-2026-0007', avaliador: avaliadorDiego, estado: 'aguardando' },
    { numero: 'PNAB-2026-0008', avaliador: avaliadorAna, estado: 'aguardando' },
    { numero: 'PNAB-2026-0009', avaliador: avaliadorBruno, estado: 'finalizada', notas: notasBloco1Altas, bonus: bonusNenhum, parecer: 'Proposta de exposição coletiva sólida, com curadoria experiente e componente educativo forte através das visitas guiadas. Ficha técnica bem detalhada.' },
    { numero: 'PNAB-2026-0010', avaliador: avaliadoraCarla, estado: 'rascunho' },
  ]

  for (const c of cenarios) {
    const inscricao = todas.find((i) => i.numero === c.numero)
    if (!inscricao) continue

    if (c.estado === 'aguardando') {
      console.log(`  [Aguardando] ${c.numero} — sem avaliação iniciada por ${c.avaliador.nome}`)
      continue
    }

    if (c.estado === 'rascunho') {
      const existente = await prisma.avaliacao.findUnique({
        where: { inscricaoId_avaliadorId: { inscricaoId: inscricao.id, avaliadorId: c.avaliador.id } },
      })
      if (!existente) {
        await prisma.avaliacao.create({
          data: { inscricaoId: inscricao.id, avaliadorId: c.avaliador.id, finalizada: false, notas: toJson([]), parecer: null, notaTotal: null },
        })
      }
      await prisma.inscricao.update({ where: { id: inscricao.id }, data: { status: 'EM_AVALIACAO' } })
      console.log(`  [Rascunho] ${c.numero} — atribuído a ${c.avaliador.nome}`)
      continue
    }

    const notas = [...(c.notas ?? []), ...(c.bonus ?? [])]
    const notaTotal = calcularTotal(c.notas ?? [], c.bonus ?? [])
    await prisma.avaliacao.upsert({
      where: { inscricaoId_avaliadorId: { inscricaoId: inscricao.id, avaliadorId: c.avaliador.id } },
      update: { finalizada: true, notas: toJson(notas), parecer: c.parecer, notaTotal },
      create: { inscricaoId: inscricao.id, avaliadorId: c.avaliador.id, finalizada: true, notas: toJson(notas), parecer: c.parecer, notaTotal },
    })
    await prisma.inscricao.update({ where: { id: inscricao.id }, data: { status: 'EM_AVALIACAO' } })
    console.log(`  [Avaliada] ${c.numero} — ${c.avaliador.nome} — nota ${notaTotal}`)
  }

  console.log('\n=== Resumo ===')
  console.log(`Edital: ${edital.titulo} (fase AVALIACAO)`)
  console.log('Avaliadores de teste (senha para todos: Teste@123):')
  console.log('  avaliador@pnab.irece.ba.gov.br   (Ana Ferreira)')
  console.log('  avaliador2@pnab.irece.ba.gov.br  (Bruno Rocha)')
  console.log('  avaliador3@pnab.irece.ba.gov.br  (Carla Menezes)')
  console.log('  avaliador4@pnab.irece.ba.gov.br  (Diego Andrade)')
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
