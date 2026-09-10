import { PrismaClient, UserRole, TipoProponente, type Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Teste@123'

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

async function main() {
  const passwordHash = await hash(DEFAULT_PASSWORD, 12)

  console.log('=== Preparando ambiente de demonstração para Mestres e Mestras ===\n')

  // 1. Garantir Usuários Avaliadores e Administradores
  const avaliadoraAna = await prisma.user.upsert({
    where: { email: 'avaliador@pnab.irece.ba.gov.br' },
    update: {
      role: UserRole.AVALIADOR,
      nome: 'Avaliadora Ana Ferreira',
      ativo: true,
    },
    create: {
      email: 'avaliador@pnab.irece.ba.gov.br',
      password: passwordHash,
      role: UserRole.AVALIADOR,
      nome: 'Avaliadora Ana Ferreira',
      cpfCnpj: '00000000004',
      ativo: true,
    },
  })

  const avaliadorBruno = await prisma.user.upsert({
    where: { email: 'avaliador2@pnab.irece.ba.gov.br' },
    update: {
      role: UserRole.AVALIADOR,
      nome: 'Avaliador Bruno Rocha',
      ativo: true,
    },
    create: {
      email: 'avaliador2@pnab.irece.ba.gov.br',
      password: passwordHash,
      role: UserRole.AVALIADOR,
      nome: 'Avaliador Bruno Rocha',
      cpfCnpj: '00000000008',
      ativo: true,
    },
  })

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pnab.irece.ba.gov.br' },
    update: {
      role: UserRole.ADMIN,
      nome: 'Administrador PNAB',
      ativo: true,
    },
    create: {
      email: 'admin@pnab.irece.ba.gov.br',
      password: passwordHash,
      role: UserRole.ADMIN,
      nome: 'Administrador PNAB',
      cpfCnpj: '00000000001',
      ativo: true,
    },
  })

  console.log('✔ Avaliadores e Admin configurados')

  // 2. Garantir Edital de Mestres e Mestras em fase AVALIACAO
  const slug = 'premiacao-mestres-mestras-irece-2026'
  let edital = await prisma.edital.findUnique({ where: { slug } })

  const categoriasConfig = [
    {
      nome: 'Mestres e Mestras das Culturas Tradicionais e Populares',
      vagasAmplaConcorrencia: 3,
      cotas: [
        { key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 },
        { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 1 },
      ],
      valorPorProjeto: 10000,
      valorTotalCategoria: 50000,
    },
  ]
  const categorias = categoriasConfig.map((c) => c.nome)

  const camposFormulario = [
    { nome: 'nome_completo', label: 'Nome completo do Mestre ou Mestra', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
    { nome: 'data_nascimento', label: 'Data de nascimento', tipo: 'data', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Idade igual ou superior a 60 anos.' },
    { nome: 'telefone_contato', label: 'Telefone/WhatsApp de contato', tipo: 'texto', obrigatorio: true, placeholder: '(74) 90000-0000', opcoes: [], hint: '' },
    { nome: 'email_contato', label: 'E-mail de contato', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
    { nome: 'tempo_atuacao_irece', label: 'Tempo de atuação cultural em Irecê (anos)', tipo: 'numero', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Requisito mínimo: 10 anos.' },
  ]

  const etapasCustomizadas = [
    {
      id: 'trajetoria-cultural',
      titulo: 'Trajetória Cultural',
      descricao: 'Conte a trajetória cultural do Mestre ou Mestra em Irecê.',
      ordem: 0,
      campos: [
        { nome: 'comunidade_referencia', label: 'Comunidade(s) ou tradição cultural de referência', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
        { nome: 'descricao_trajetoria', label: 'Descrição da trajetória cultural', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Notório conhecimento e transmissão de saberes.', maxLength: 2000 },
        { nome: 'reconhecimento_publico', label: 'Reconhecimento público da trajetória', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Reconhecimento por instituições públicas ou comunidade.', maxLength: 1200 },
        { nome: 'banco_nome', label: 'Nome do banco', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Dados bancários (Anexo 04).' },
        { nome: 'banco_numero', label: 'Número do banco', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
        { nome: 'agencia_numero', label: 'Número da agência', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
        { nome: 'conta_tipo', label: 'Tipo de conta', tipo: 'multiselect', obrigatorio: true, placeholder: '', hint: 'Selecione uma opção.', opcoes: ['Conta Corrente', 'Conta Poupança'] },
        { nome: 'conta_numero', label: 'Número da conta', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
        { nome: 'praca_pagamento', label: 'Praça de pagamento', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      ],
    },
  ]

  const criteriosAvaliacao = [
    {
      modo: 'slider' as const,
      peso: 1,
      notaMax: 10,
      criterio: 'A) Singularidade da Trajetória Artística',
      descricao: 'Consistência e singularidade da atuação da Mestra ou Mestre; excelência no desenvolvimento de sua atividade junto à comunidade.',
    },
    {
      modo: 'slider' as const,
      peso: 1,
      notaMax: 10,
      criterio: 'B) Impacto da Trajetória na Coletividade e na Cidade de Irecê',
      descricao: 'Contribuição para o desenvolvimento, transmissão, difusão ou preservação de saberes e fazeres culturais; influência na formação de redes, grupos ou coletivos culturais.',
    },
    {
      modo: 'slider' as const,
      peso: 1,
      notaMax: 10,
      criterio: 'C) Reconhecimento Público da Contribuição da Trajetória',
      descricao: 'Reconhecimento da trajetória por instituições públicas, organizações da sociedade civil e comunidade; relevância e longevidade da atuação cultural no território.',
    },
  ]

  const tiposAnexo = [
    { tipo: 'CARTA_RECONHECIMENTO', label: 'Carta de Reconhecimento ou Declaração de Trajetória (Anexo 01)', obrigatorio: true },
    { tipo: 'COMPROVACAO_TRAJETORIA', label: 'Material de Comprovação da Trajetória Cultural (fotos, matérias, prêmios etc.)', obrigatorio: true },
    { tipo: 'AUTODECL_ETNICO_RACIAL', label: 'Autodeclaração Étnico-Racial (Anexo 02)', obrigatorio: false },
    { tipo: 'AUTODECL_PCD', label: 'Autodeclaração para Pessoa com Deficiência (Anexo 03)', obrigatorio: false },
  ]

  const cronograma = [
    { tipo: 'custom', label: 'Publicação do Edital', dataHora: '2026-07-28T00:00:00' },
    { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-07-31T00:00:00' },
    { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-08-28T23:59:00' },
    { tipo: 'fase', fase: 'HABILITACAO', dataHora: '2026-08-29T00:00:00' },
    { tipo: 'fase', fase: 'AVALIACAO', dataHora: '2026-09-08T00:00:00' },
    { tipo: 'fase', fase: 'RESULTADO_PRELIMINAR', dataHora: '2026-09-30T00:00:00' },
    { tipo: 'fase', fase: 'RECURSO', dataHora: '2026-10-01T00:00:00' },
    { tipo: 'fase', fase: 'RESULTADO_FINAL', dataHora: '2026-10-10T00:00:00' },
    { tipo: 'fase', fase: 'ENCERRADO', dataHora: '2026-10-31T23:59:00' },
  ]

  if (edital) {
    edital = await prisma.edital.update({
      where: { id: edital.id },
      data: {
        status: 'AVALIACAO',
        categorias,
        categoriasConfig: toJson(categoriasConfig),
        camposFormulario: toJson(camposFormulario),
        etapasCustomizadas: toJson(etapasCustomizadas),
        criteriosAvaliacao: toJson(criteriosAvaliacao),
        formulaAvaliacao: null,
        notaMinima: 3.33,
        tiposAnexo: toJson(tiposAnexo),
        cronograma: toJson(cronograma),
        tiposProponentePermitidos: ['PF'],
        videoHabilitado: true,
      },
    })
  } else {
    edital = await prisma.edital.create({
      data: {
        titulo: 'Premiação para Mestres e Mestras de Irecê',
        slug,
        ano: 2026,
        status: 'AVALIACAO',
        resumo: 'Edital de Chamamento Público Nº 02/2026 para premiação de Mestres ou Mestras das Culturas Tradicionais e Populares de Irecê.',
        valorTotal: 50000,
        categorias,
        categoriasConfig: toJson(categoriasConfig),
        regrasElegibilidade: 'Pessoa física com idade igual ou superior a 60 anos e atuação artística há mais de 10 anos em Irecê.',
        acoesAfirmativas: 'Cotas para pessoas negras (1 vaga) e indígenas/PCD (1 vaga).',
        tiposProponentePermitidos: ['PF'],
        cronograma: toJson(cronograma),
        camposFormulario: toJson(camposFormulario),
        etapasCustomizadas: toJson(etapasCustomizadas),
        criteriosAvaliacao: toJson(criteriosAvaliacao),
        formulaAvaliacao: null,
        tiposAnexo: toJson(tiposAnexo),
        notaMinima: 3.33,
        videoHabilitado: true,
      },
    })
  }

  console.log(`✔ Edital "${edital.titulo}" atualizado para status AVALIACAO`)

  // 3. Vincular Avaliadores à Equipe do Edital (EditalMembro)
  await prisma.editalMembro.upsert({
    where: { editalId_userId_funcao: { editalId: edital.id, userId: avaliadoraAna.id, funcao: 'AVALIADOR' } },
    update: {},
    create: { editalId: edital.id, userId: avaliadoraAna.id, funcao: 'AVALIADOR' },
  })

  await prisma.editalMembro.upsert({
    where: { editalId_userId_funcao: { editalId: edital.id, userId: avaliadorBruno.id, funcao: 'AVALIADOR' } },
    update: {},
    create: { editalId: edital.id, userId: avaliadorBruno.id, funcao: 'AVALIADOR' },
  })

  console.log('✔ Equipe de avaliadores vinculada ao edital')

  // 4. Limpar inscrições anteriores deste edital para termos um cenário límpido
  await prisma.recursoResposta.deleteMany({ where: { recurso: { inscricao: { editalId: edital.id } } } })
  await prisma.recurso.deleteMany({ where: { inscricao: { editalId: edital.id } } })
  await prisma.avaliacao.deleteMany({ where: { inscricao: { editalId: edital.id } } })
  await prisma.anexoInscricao.deleteMany({ where: { inscricao: { editalId: edital.id } } })
  await prisma.projetoApoiado.deleteMany({ where: { inscricao: { editalId: edital.id } } })
  await prisma.inscricao.deleteMany({ where: { editalId: edital.id } })

  console.log('✔ Inscrições antigas do edital limpas com sucesso')

  // 5. Criar Mestres e Mestras Proponentes (PF)
  const mestres = [
    {
      email: 'mestra.sebastiana@teste.com',
      nome: 'Mestra Sebastiana da Lapinha',
      cpfCnpj: '11122233344',
      telefone: '(74) 99876-1101',
      dataNascimento: '1954-03-15',
      tempoAtuacao: 48,
      comunidade: 'Comunidade Quilombola da Lapinha / Irecê',
      descricaoTrajetoria: 'Iniciou no Reisado aos 12 anos com seus avós. Há mais de 45 anos é a Mestra regente do Terno de Reis da Lapinha, confeccionando as vestimentas tradicionais, compondo versos e ensinando crianças e jovens os toques de viola, zabumba e pandeiro tradicional.',
      reconhecimentoPublico: 'Homenageada no Encontro Regional de Culturas Populares do Sertão em 2018 e pelo Ponto de Cultura Raízes da Caatinga.',
      cotas: ['negros'],
      submissaoPorVideo: false,
      scenario: 'aguardando', // Sem avaliador atribuído
    },
    {
      email: 'mestre.laurindo@teste.com',
      nome: 'Mestre Laurindo dos Pífanos',
      cpfCnpj: '55566677788',
      telefone: '(74) 99876-1105',
      dataNascimento: '1956-07-22',
      tempoAtuacao: 42,
      comunidade: 'Povoado de Itapicuru / Irecê',
      descricaoTrajetoria: 'Artesão e tocador de pífano em taboca de bambu silvestre. Fundador da Banda de Pífanos Estrela do Sertão, atua nas festas de São Pedro, novenas e cortejos comunitários desde 1982.',
      reconhecimentoPublico: 'Registro audiovisual no Memorial do Sertão de Irecê e menção honrosa da Secretaria Municipal de Cultura.',
      cotas: [],
      submissaoPorVideo: true, // Submissão por vídeo (oralidade)
      scenario: 'aguardando', // Sem avaliador atribuído
    },
    {
      email: 'mestre.antonio@teste.com',
      nome: 'Mestre Antônio do Repente',
      cpfCnpj: '22233344455',
      telefone: '(74) 99876-1102',
      dataNascimento: '1958-11-08',
      tempoAtuacao: 36,
      comunidade: 'Feira Livre e Bairro Recanto dos Pássaros / Irecê',
      descricaoTrajetoria: 'Cantor repentista, cordelista e declamador tradicional. Realiza desafios de viola nas feiras livres e eventos rurais da microrregião de Irecê. Possui mais de 30 folhetos de cordel impressos e distribuídos na região.',
      reconhecimentoPublico: 'Premiado no Festival de Violeiros da Chapada e Sertão de Irecê.',
      cotas: [],
      submissaoPorVideo: false,
      scenario: 'pendente_para_avaliar_ao_vivo', // Atribuído à Ana, pronto para preencher na aula!
    },
    {
      email: 'joana.arte@teste.com',
      nome: 'Dona Joana Souza dos Santos',
      cpfCnpj: '98765432100',
      telefone: '(74) 99888-1234',
      dataNascimento: '1962-05-19',
      tempoAtuacao: 28,
      comunidade: 'Bairro Novo Horizonte / Irecê',
      descricaoTrajetoria: 'Mestra na confecção de colchas de retalho, fuxico e tecelagem manual em tear de pedal. Transmite a arte do fuxico para mulheres da comunidade, gerando renda e fortalecendo os laços comunitários.',
      reconhecimentoPublico: 'Reconhecida pela Associação de Mulheres Rurais e expositora oficial da Feira de Artesanato Regional.',
      cotas: [],
      submissaoPorVideo: false,
      scenario: 'rascunho_salvo', // Atribuído à Ana, notas parciais salvas como rascunho
    },
    {
      email: 'mestra.maria.barro@teste.com',
      nome: 'Mestra Maria Lourenço (Maria do Barro)',
      cpfCnpj: '33344455566',
      telefone: '(74) 99876-1103',
      dataNascimento: '1957-09-02',
      tempoAtuacao: 44,
      comunidade: 'Comunidade Rural de São Gabriel / Irecê',
      descricaoTrajetoria: 'Ceramista de tradição ancestral. Extrai e queima o barro em forno à lenha comunitário, modelando panelas, potes de água, figuras sacras e bichos do sertão sem uso de torno elétrico.',
      reconhecimentoPublico: 'Obras no Museu Casa do Sertão e certificado de Notório Saber Popular outorgado por conselho de mestres.',
      cotas: ['indigena_pcd'],
      submissaoPorVideo: false,
      scenario: 'avaliada_excelente', // Avaliação finalizada com nota alta
    },
    {
      email: 'mestre.ze.angola@teste.com',
      nome: 'Mestre Zé de Abreu',
      cpfCnpj: '44455566677',
      telefone: '(74) 99876-1104',
      dataNascimento: '1952-01-20',
      tempoAtuacao: 52,
      comunidade: 'Bairro Baixão / Irecê',
      descricaoTrajetoria: 'Mais antigo Mestre de Capoeira Angola em atividade na cidade. Guardião dos toques rituais de São Bento Grande, Angola e Cavalaria, e fabricante artesanal de berimbaus com cabaças nativas.',
      reconhecimentoPublico: 'Título de Cidadão Benemérito da Cultura Tradicional e mestre homenageado da Roda dos Mestres.',
      cotas: [],
      submissaoPorVideo: false,
      scenario: 'avaliada_finalizada', // Avaliação finalizada
    },
  ]

  let inscricaoCount = 1

  for (const m of mestres) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        nome: m.nome,
        role: UserRole.PROPONENTE,
        tipoProponente: TipoProponente.PF,
        telefone: m.telefone,
        cpfCnpj: m.cpfCnpj,
        ativo: true,
      },
      create: {
        email: m.email,
        password: passwordHash,
        nome: m.nome,
        role: UserRole.PROPONENTE,
        tipoProponente: TipoProponente.PF,
        telefone: m.telefone,
        cpfCnpj: m.cpfCnpj,
        ativo: true,
      },
    })

    const numero = `PNAB-2026-MESTRES-${String(inscricaoCount).padStart(3, '0')}`
    inscricaoCount++

    const campos = {
      nome_completo: m.nome,
      data_nascimento: m.dataNascimento,
      telefone_contato: m.telefone,
      email_contato: m.email,
      tempo_atuacao_irece: m.tempoAtuacao,
      comunidade_referencia: m.comunidade,
      descricao_trajetoria: m.descricaoTrajetoria,
      reconhecimento_publico: m.reconhecimentoPublico,
      banco_nome: 'Banco do Brasil',
      banco_numero: '001',
      agencia_numero: '0458-2',
      conta_tipo: ['Conta Corrente'],
      conta_numero: `${12000 + inscricaoCount}-9`,
      praca_pagamento: 'Irecê / BA',
    }

    const isInscricaoEmAvaliacao = m.scenario !== 'aguardando'
    const statusInscricao = isInscricaoEmAvaliacao ? 'EM_AVALIACAO' : 'HABILITADA'

    const inscricao = await prisma.inscricao.create({
      data: {
        numero,
        editalId: edital.id,
        proponenteId: user.id,
        status: statusInscricao,
        categoria: 'Mestres e Mestras das Culturas Tradicionais e Populares',
        cotasOptIn: m.cotas,
        submissaoPorVideo: m.submissaoPorVideo,
        campos: toJson(campos),
        submittedAt: new Date('2026-08-20T14:30:00Z'),
        resultadoLiberadoEm: new Date('2026-09-04T10:00:00Z'),
      },
    })

    // Anexos da Inscrição
    await prisma.anexoInscricao.createMany({
      data: [
        {
          inscricaoId: inscricao.id,
          tipo: 'CARTA_RECONHECIMENTO',
          titulo: 'Anexo 01 — Carta de Reconhecimento Comunitário.pdf',
          url: 'https://pnab.irece.ba.gov.br/docs/modelo-declaracao-parceria.pdf',
          valido: true,
        },
        {
          inscricaoId: inscricao.id,
          tipo: 'COMPROVACAO_TRAJETORIA',
          titulo: 'Anexo — Portfólio e Comprovação da Trajetória (Notícias e Fotos).pdf',
          url: 'https://pnab.irece.ba.gov.br/docs/comprovacao-trajetoria-exemplo.pdf',
          valido: true,
        },
        ...(m.cotas.includes('negros')
          ? [
              {
                inscricaoId: inscricao.id,
                tipo: 'AUTODECL_ETNICO_RACIAL',
                titulo: 'Anexo 02 — Autodeclaração Étnico-Racial.pdf',
                url: 'https://pnab.irece.ba.gov.br/docs/modelo-autodeclaracao-etnico-racial.pdf',
                valido: true,
              },
            ]
          : []),
        ...(m.cotas.includes('indigena_pcd')
          ? [
              {
                inscricaoId: inscricao.id,
                tipo: 'AUTODECL_PCD',
                titulo: 'Anexo 03 — Autodeclaração para Pessoa com Deficiência.pdf',
                url: 'https://pnab.irece.ba.gov.br/docs/modelo-autodeclaracao-pcd.pdf',
                valido: true,
              },
            ]
          : []),
      ],
    })

    // Criação dos cenários de Avaliação
    if (m.scenario === 'pendente_para_avaliar_ao_vivo') {
      // Inscrição atribuída à Avaliadora Ana, pronta para avaliar ao vivo na gravação/aula!
      await prisma.avaliacao.create({
        data: {
          inscricaoId: inscricao.id,
          avaliadorId: avaliadoraAna.id,
          finalizada: false,
          notas: toJson([]),
          parecer: null,
          notaTotal: null,
        },
      })
      console.log(`  [Pendente] ${numero} — ${m.nome} (Atribuído a Ana, pronto para avaliar ao vivo)`)
    } else if (m.scenario === 'rascunho_salvo') {
      // Inscrição com rascunho salvo
      const rascunhoNotas = [
        { criterio: 'A) Singularidade da Trajetória Artística', nota: 8.5, peso: 1 },
        { criterio: 'B) Impacto da Trajetória na Coletividade e na Cidade de Irecê', nota: 9.0, peso: 1 },
        { criterio: 'C) Reconhecimento Público da Contribuição da Trajetória', nota: 8.0, peso: 1 },
      ]
      await prisma.avaliacao.create({
        data: {
          inscricaoId: inscricao.id,
          avaliadorId: avaliadoraAna.id,
          finalizada: false,
          notas: toJson(rascunhoNotas),
          parecer: 'Rascunho de análise: Proponente possui longa dedicação ao artesanato tradicional de fuxico. Documentação em conformidade. Aguardando conferência final da carta.',
          notaTotal: 8.5,
        },
      })
      console.log(`  [Rascunho] ${numero} — ${m.nome} (Atribuído a Ana, com rascunho de notas salvo)`)
    } else if (m.scenario === 'avaliada_excelente') {
      // Inscrição avaliada e finalizada com nota alta
      const notas = [
        { criterio: 'A) Singularidade da Trajetória Artística', nota: 9.5, peso: 1 },
        { criterio: 'B) Impacto da Trajetória na Coletividade e na Cidade de Irecê', nota: 9.5, peso: 1 },
        { criterio: 'C) Reconhecimento Público da Contribuição da Trajetória', nota: 9.0, peso: 1 },
      ]
      await prisma.avaliacao.create({
        data: {
          inscricaoId: inscricao.id,
          avaliadorId: avaliadoraAna.id,
          finalizada: true,
          notas: toJson(notas),
          parecer: 'Mestra de saber ancestral indiscutível. Sua oficina de cerâmica tradicional constitui patrimônio vivo do território de Irecê. Trajetória com mais de quatro décadas de transmissão contínua e farta comprovação documental.',
          notaTotal: 9.33,
        },
      })
      console.log(`  [Avaliada] ${numero} — ${m.nome} (Finalizada — Nota 9.33)`)
    } else if (m.scenario === 'avaliada_finalizada') {
      // Inscrição avaliada e finalizada
      const notas = [
        { criterio: 'A) Singularidade da Trajetória Artística', nota: 9.0, peso: 1 },
        { criterio: 'B) Impacto da Trajetória na Coletividade e na Cidade de Irecê', nota: 8.5, peso: 1 },
        { criterio: 'C) Reconhecimento Público da Contribuição da Trajetória', nota: 8.5, peso: 1 },
      ]
      await prisma.avaliacao.create({
        data: {
          inscricaoId: inscricao.id,
          avaliadorId: avaliadoraAna.id,
          finalizada: true,
          notas: toJson(notas),
          parecer: 'Mestre Zé de Abreu é referência histórica da Capoeira Angola no sertão de Irecê. Demonstrou pleno cumprimento de todos os requisitos de notório saber e forte impacto geracional.',
          notaTotal: 8.67,
        },
      })
      console.log(`  [Avaliada] ${numero} — ${m.nome} (Finalizada — Nota 8.67)`)
    } else {
      console.log(`  [Aguardando] ${numero} — ${m.nome} (Sem avaliador — aguardando distribuição)`)
    }
  }

  console.log('\n=== Resumo do Ambiente Criado ===')
  console.log(`Edital: Premiação para Mestres e Mestras de Irecê (ID: ${edital.id})`)
  console.log('Status: AVALIACAO (Fase aberta)')
  console.log('\nAvaliador Principal para teste:')
  console.log('  E-mail: avaliador@pnab.irece.ba.gov.br')
  console.log(`  Senha:  ${DEFAULT_PASSWORD}`)
  console.log('\nAdministrador:')
  console.log('  E-mail: admin@pnab.irece.ba.gov.br')
  console.log(`  Senha:  ${DEFAULT_PASSWORD}`)
  console.log('\nDistribuição nas abas do painel /admin/avaliacao:')
  console.log('  • Aguardando avaliadores (2): Mestra Sebastiana da Lapinha e Mestre Laurindo dos Pífanos')
  console.log('  • Em avaliação (2): Mestre Antônio do Repente (em branco, para avaliar na aula) e Dona Joana (com rascunho)')
  console.log('  • Avaliadas (2): Mestra Maria Lourenço (Nota 9.33) e Mestre Zé de Abreu (Nota 8.67)')
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
