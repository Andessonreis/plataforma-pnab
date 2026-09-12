export interface AnexoSeedItem {
  tipo: string
  titulo: string
  url: string
  valido?: boolean | null
  observacao?: string | null
  juntadoPelaSecretaria?: boolean
  origemNota?: string | null
}

export interface InscricaoSeedItem {
  numero: string
  proponenteEmail: string
  categoria: string
  cotasOptIn: string[]
  campos: Record<string, unknown>
  orcamento: Array<{ item: string; quantidade: number; valorUnitario: number; total: number }>
  anexos: AnexoSeedItem[]
}

export const inscricoesPendentesData: InscricaoSeedItem[] = [
  {
    numero: 'PNAB-2025-FORM-001',
    proponenteEmail: 'mundinha.reisado@teste.com',
    categoria: 'Workshops de Música e Tradição Oral',
    cotasOptIn: ['negros'],
    campos: {
      nome_completo: 'Maria Raimunda de Jesus',
      telefone_contato: '(74) 99912-3456',
      email_contato: 'mundinha.reisado@teste.com',
      nome_oficina: 'Oficina de Tradição Oral e Cantigas de Reisado do Sertão de Irecê',
      ementa: 'Transmissão intergeracional de toques, versos e toadas do reisado tradicional do Bairro São José, resgatando a memória viva e os festejos populares.',
      carga_horaria: 24,
      vagas_oferecidas: 30,
      local_realizacao: 'Barracão Cultural do Bairro São José / Centro de Convivência',
      publico_prioritario: ['Pessoas Negras', 'Idosos', 'Jovens de periferia'],
    },
    orcamento: [
      { item: 'Honorários de Mestre Tradicional e Instrutores', quantidade: 1, valorUnitario: 5000, total: 5000 },
      { item: 'Material de consumo (fitas, tecidos, instrumentos percussivos)', quantidade: 1, valorUnitario: 1800, total: 1800 },
      { item: 'Serviço de registro em áudio e fotografia', quantidade: 1, valorUnitario: 1200, total: 1200 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'RG_e_CPF_Maria_Raimunda.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: null },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Conta_Coelba_Bairro_Sao_Jose_Irece.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: null },
      { tipo: 'PORTFOLIO', titulo: 'Clipping_Reisado_Irece_Fotos_e_Certificados.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: null },
      { tipo: 'PROJETO', titulo: 'Plano_Pedagogico_Oficina_Reisado.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: null },
      { tipo: 'AUTODECL_ETNICO_RACIAL', titulo: 'Autodeclaracao_Etnico_Racial_Assinada.pdf', url: 'https://pnab.irece.ba.gov.br/docs/autodeclaracao.pdf', valido: null },
    ],
  },
  {
    numero: 'PNAB-2025-FORM-002',
    proponenteEmail: 'danilo.hiphop@teste.com',
    categoria: 'Oficinas de Artes Cênicas e Dança',
    cotasOptIn: [],
    campos: {
      nome_completo: 'Danilo Santana dos Santos',
      telefone_contato: '(74) 99981-2244',
      email_contato: 'danilo.hiphop@teste.com',
      nome_oficina: 'Workshop de Dança Breaking e Expressão Corporal Urbana',
      ementa: 'Iniciação aos fundamentos do Breaking, musicalidade, consciência corporal e integração social através da cultura Hip Hop para jovens de escolas públicas.',
      carga_horaria: 20,
      vagas_oferecidas: 25,
      local_realizacao: 'Praça da Juventude / Centro Cultural de Irecê',
      publico_prioritario: ['Jovens de periferia', 'Público Geral'],
    },
    orcamento: [
      { item: 'Instrutor de Dança Urbana (20 horas/aula)', quantidade: 1, valorUnitario: 4500, total: 4500 },
      { item: 'Locação de sonorização e tapete linóleo', quantidade: 1, valorUnitario: 2200, total: 2200 },
      { item: 'Camisetas personalizadas para os participantes', quantidade: 25, valorUnitario: 52, total: 1300 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'RG_CPF_Danilo_Santana.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: null },
      { tipo: 'CNPJ_DOCUMENTO', titulo: 'Certificado_MEI_Danilo_Santana.pdf', url: 'https://pnab.irece.ba.gov.br/docs/cnpj.pdf', valido: null },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Comprovante_Endereco_Comercial_Irece.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: null },
      { tipo: 'PORTFOLIO', titulo: 'Portfolio_Apresentacoes_Batalhas_HipHop.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: null },
      { tipo: 'PROJETO', titulo: 'Plano_de_Curso_Breaking_Urbano.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: null },
    ],
  },
  {
    numero: 'PNAB-2025-FORM-003',
    proponenteEmail: 'coletivo.mandacaru@teste.com',
    categoria: 'Capacitação em Cultura Digital e Audiovisual',
    cotasOptIn: [],
    campos: {
      nome_completo: 'Coletivo Audiovisual Mandacaru de Irecê',
      telefone_contato: '(74) 99823-7711',
      email_contato: 'coletivo.mandacaru@teste.com',
      nome_oficina: 'Curso Prático de Produção Audiovisual com Smartphones no Semiárido',
      ementa: 'Capacitação prática em captação de imagem, roteiro comunitário e edição de vídeo em celulares, com foco na difusão da identidade cultural sertaneja.',
      carga_horaria: 32,
      vagas_oferecidas: 20,
      local_realizacao: 'Escola Família Agrícola / Sede do Coletivo em Copirecê',
      publico_prioritario: ['Comunidades Rurais', 'Jovens de periferia'],
    },
    orcamento: [
      { item: 'Equipe de formação (Roteiro, Captação e Edição)', quantidade: 2, valorUnitario: 3000, total: 6000 },
      { item: 'Microfones de lapela e tripés para celular (kit didático)', quantidade: 5, valorUnitario: 240, total: 1200 },
      { item: 'Material impresso de apoio e cartilha digital', quantidade: 1, valorUnitario: 800, total: 800 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'Documentos_Representante_Larissa_Gomes.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: null },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Comprovante_Residencia_Copirece_Irece.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: null },
      { tipo: 'DECLARACAO_REPRESENTACAO_GRUPO', titulo: 'Ata_e_Declaracao_Coletivo_Mandacaru.pdf', url: 'https://pnab.irece.ba.gov.br/docs/declaracao-grupo.pdf', valido: null },
      { tipo: 'PORTFOLIO', titulo: 'Portfolio_Curtas_e_Mostras_Audiovisuais.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: null },
      { tipo: 'PROJETO', titulo: 'Ementa_Curso_Smartphones_Mandacaru.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: null },
      {
        tipo: 'CERTIDAO_MUNICIPAL',
        titulo: 'Certidao_Atualizada_Recebida_por_Email.pdf',
        url: 'https://pnab.irece.ba.gov.br/docs/certidao.pdf',
        valido: null,
        juntadoPelaSecretaria: true,
        origemNota: 'Recebido por e-mail institucional no dia 05/09/2026 conforme Retificação nº 02',
      },
    ],
  },
  {
    numero: 'PNAB-2025-FORM-004',
    proponenteEmail: 'tiago.artesvisuais@teste.com',
    categoria: 'Formação em Artes Visuais e Artesanato',
    cotasOptIn: ['indigena_pcd'],
    campos: {
      nome_completo: 'Tiago Barbosa Neves',
      telefone_contato: '(74) 99945-8899',
      email_contato: 'tiago.artesvisuais@teste.com',
      nome_oficina: 'Oficina Inclusiva de Pintura em Tela e Técnicas Mistas do Sertão',
      ementa: 'Experimentação pictórica com pigmentos minerais e tintas acrílicas, com adaptações ergonômicas para pessoas com deficiência física e mobilidade reduzida.',
      carga_horaria: 24,
      vagas_oferecidas: 20,
      local_realizacao: 'Espaço Multiuso da Associação Pestalozzi de Irecê',
      publico_prioritario: ['Pessoas com Deficiência (PCD)', 'Mulheres', 'Público Geral'],
    },
    orcamento: [
      { item: 'Instrutor de Artes Visuais e Monitor de Apoio PCD', quantidade: 1, valorUnitario: 5200, total: 5200 },
      { item: 'Telas de pintura 40x50cm, tintas acrílicas e pincéis adaptados', quantidade: 1, valorUnitario: 2100, total: 2100 },
      { item: 'Catálogo impresso com as obras dos alunos da oficina', quantidade: 1, valorUnitario: 700, total: 700 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'Documento_Oficial_RG_CPF_Tiago.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: null },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Conta_Embasa_Recanto_das_Arvores.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: null },
      { tipo: 'PORTFOLIO', titulo: 'Portfolio_Exposicoes_Pintura_Tiago_Neves.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: null },
      { tipo: 'PROJETO', titulo: 'Plano_Trabalho_Pintura_Inclusiva.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: null },
      { tipo: 'AUTODECL_PCD', titulo: 'Laudo_Medico_e_Autodeclaracao_PCD.pdf', url: 'https://pnab.irece.ba.gov.br/docs/autodeclaracao-pcd.pdf', valido: null },
    ],
  },
  {
    numero: 'PNAB-2025-FORM-005',
    proponenteEmail: 'nonato.pifano@teste.com',
    categoria: 'Workshops de Música e Tradição Oral',
    cotasOptIn: ['negros'],
    campos: {
      nome_completo: 'Raimundo Nonato Ferreira',
      telefone_contato: '(74) 99966-1289',
      email_contato: 'nonato.pifano@teste.com',
      nome_oficina: 'Oficina de Confecção de Pífanos de Taboca e Toques Tradicionais do Sertão',
      ementa: 'Oficina prática de corte, furação e afinação de pífanos com taboca nativa, seguida de prática coletiva de marcha de novena e baião.',
      carga_horaria: 30,
      vagas_oferecidas: 20,
      local_realizacao: 'Associação Comunitária de Produtores de Itapicuru / Zona Rural',
      publico_prioritario: ['Comunidades Rurais', 'Pessoas Negras', 'Jovens de periferia'],
    },
    orcamento: [
      { item: 'Honorários Mestre Artesão e Músico Tradicional', quantidade: 1, valorUnitario: 5000, total: 5000 },
      { item: 'Matéria-prima (varas de taboca selecionada, ferramentas e lixas)', quantidade: 1, valorUnitario: 1800, total: 1800 },
      { item: 'Transporte e alimentação para os participantes da zona rural', quantidade: 1, valorUnitario: 1200, total: 1200 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'RG_CPF_Raimundo_Nonato.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: null },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Declaracao_Sindicato_Trabalhadores_Rurais_Irece.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: null },
      { tipo: 'PORTFOLIO', titulo: 'Historico_Banda_de_Pifanos_Itapicuru.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: null },
      { tipo: 'PROJETO', titulo: 'Metodologia_Oficina_Pifanos_Taboca.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: null },
      { tipo: 'AUTODECL_ETNICO_RACIAL', titulo: 'Autodeclaracao_Etnico_Racial_Nonato.pdf', url: 'https://pnab.irece.ba.gov.br/docs/autodeclaracao.pdf', valido: null },
    ],
  },
]
