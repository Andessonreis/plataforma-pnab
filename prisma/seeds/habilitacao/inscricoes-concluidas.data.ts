import type { AnexoSeedItem } from './inscricoes-pendentes.data'

export interface InscricaoConcluidaSeedItem {
  numero: string
  proponenteEmail: string
  categoria: string
  status: 'HABILITADA' | 'INABILITADA'
  cotasOptIn: string[]
  motivoInabilitacao?: string | null
  campos: Record<string, unknown>
  orcamento: Array<{ item: string; quantidade: number; valorUnitario: number; total: number }>
  anexos: AnexoSeedItem[]
  recurso?: {
    fase: string
    texto: string
    decisao?: string | null
    justificativa?: string | null
  }
}

export const inscricoesConcluidasData: InscricaoConcluidaSeedItem[] = [
  {
    numero: 'PNAB-2025-FORM-006',
    proponenteEmail: 'claudia.cordel@teste.com',
    categoria: 'Oficinas de Artes Cênicas e Dança',
    status: 'HABILITADA',
    cotasOptIn: [],
    campos: {
      nome_completo: 'Cláudia Vasconcelos Ribeiro',
      telefone_contato: '(74) 99933-6622',
      email_contato: 'claudia.cordel@teste.com',
      nome_oficina: 'Cordel na Escola: Oficinas de Métrica, Rima e Gravura Sertaneja',
      ementa: 'Ensino da estrutura do verso sertanejo (sextilhas, septilhas e martelo agalopado) e oficina básica de xilogravura em madeira e linóleo para professores e estudantes.',
      carga_horaria: 24,
      vagas_oferecidas: 30,
      local_realizacao: 'Biblioteca Municipal e Colégio Estadual de Irecê',
      publico_prioritario: ['Jovens de periferia', 'Mulheres'],
    },
    orcamento: [
      { item: 'Honorários instrutora de literatura popular', quantidade: 1, valorUnitario: 4800, total: 4800 },
      { item: 'Impressão de folhetos de cordel produzidos na oficina', quantidade: 500, valorUnitario: 4.4, total: 2200 },
      { item: 'Goivas, tintas gráficas e papel para xilogravura', quantidade: 1, valorUnitario: 1000, total: 1000 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'RG_CPF_Claudia_Vasconcelos.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: true, observacao: 'Documento pessoal oficial legível e regular.' },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Comprovante_Coelba_Vivendas_Irece.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: true, observacao: 'Comprovante Coelba emitido em agosto/2026 em nome da titular no Bairro Vivendas.' },
      { tipo: 'PORTFOLIO', titulo: 'Portfolio_Publicacoes_e_Aulas_Cordel.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: true, observacao: 'Comprovação satisfatória com 4 folhetos publicados e histórico de 6 anos de atuação.' },
      { tipo: 'PROJETO', titulo: 'Plano_Pedagogico_Cordel_Escola.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: true, observacao: 'Ementa clara, cronograma bem estruturado e compatível com as regras.' },
    ],
  },
  {
    numero: 'PNAB-2025-FORM-007',
    proponenteEmail: 'artesaos.irece@teste.com',
    categoria: 'Formação em Artes Visuais e Artesanato',
    status: 'HABILITADA',
    cotasOptIn: [],
    campos: {
      nome_completo: 'Associação dos Artesãos do Território de Irecê',
      telefone_contato: '(74) 3641-2050',
      email_contato: 'artesaos.irece@teste.com',
      nome_oficina: 'Ciclo de Transmissão de Saberes em Trançado de Licuri e Cerâmica',
      ementa: 'Workshops práticos de colheita consciente, tratamento da palha de licuri, técnicas ancestrais de trançado e modelagem básica de peças utilitárias em barro.',
      carga_horaria: 40,
      vagas_oferecidas: 35,
      local_realizacao: 'Centro de Artesanato de Irecê (Praça Ayrton Senna)',
      publico_prioritario: ['Mulheres', 'Comunidades Rurais', 'Idosos'],
    },
    orcamento: [
      { item: 'Mestres artesãos instrutores (2 turmas)', quantidade: 2, valorUnitario: 3000, total: 6000 },
      { item: 'Aquisição de palha de licuri e argila pura', quantidade: 1, valorUnitario: 1400, total: 1400 },
      { item: 'Exposição de encerramento e feira dos produtos', quantidade: 1, valorUnitario: 600, total: 600 },
    ],
    anexos: [
      { tipo: 'CNPJ_DOCUMENTO', titulo: 'Cartao_CNPJ_e_Estatuto_Associacao.pdf', url: 'https://pnab.irece.ba.gov.br/docs/cnpj.pdf', valido: true, observacao: 'Pessoa jurídica regularmente constituída com CNPJ ativo em Irecê há 8 anos.' },
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'Ata_Posse_Diretoria_e_RG_Presidente.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: true, observacao: 'Ata registrada em cartório de Irecê e documento oficial do representante legal.' },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Comprovante_Sede_Associacao_Centro.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: true, observacao: 'Endereço da sede no Centro de Irecê devidamente comprovado.' },
      { tipo: 'PORTFOLIO', titulo: 'Relatorio_Anual_Feiras_e_Oficinas.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: true, observacao: 'Portfólio amplo com premiações regionais e mostras realizadas.' },
      { tipo: 'PROJETO', titulo: 'Projeto_Pedagogico_Licuri_e_Ceramica.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: true, observacao: 'Plano com metas claras e alinhado aos objetivos da PNAB.' },
      { tipo: 'CERTIDAO_MUNICIPAL', titulo: 'CND_Tributos_Municipais_Irece.pdf', url: 'https://pnab.irece.ba.gov.br/docs/certidao.pdf', valido: true, observacao: 'Certidão negativa de débitos municipais válida.' },
    ],
  },
  {
    numero: 'PNAB-2025-FORM-008',
    proponenteEmail: 'antonio.percussao@teste.com',
    categoria: 'Workshops de Música e Tradição Oral',
    status: 'INABILITADA',
    cotasOptIn: [],
    motivoInabilitacao: 'Comprovante de residência inválido ou com prazo vencido — Documento apresentado em nome de terceiro sem declaração de coabitação/locação ou parentesco com firma reconhecida, contrariando o subitem 4.2.1 do edital.',
    campos: {
      nome_completo: 'Antônio Carlos Silveira Ramos',
      telefone_contato: '(74) 99899-3311',
      email_contato: 'antonio.percussao@teste.com',
      nome_oficina: 'Oficina de Percussão Nordestina: Zabumba, Triângulo e Pandeiro',
      ementa: 'Prática de ritmos nordestinos (baião, xaxado e arrasta-pé) para instrumentistas iniciantes.',
      carga_horaria: 20,
      vagas_oferecidas: 20,
      local_realizacao: 'Associação de Moradores do Bairro Boa Vista',
      publico_prioritario: ['Jovens de periferia'],
    },
    orcamento: [
      { item: 'Instrutor de Percussão (20 horas)', quantidade: 1, valorUnitario: 4800, total: 4800 },
      { item: 'Manutenção e afinação de instrumentos', quantidade: 1, valorUnitario: 3200, total: 3200 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'RG_CPF_Antonio_Carlos.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: true, observacao: 'Documentação pessoal regular.' },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Fatura_Embasa_Nome_Terceiro.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: false, observacao: 'Fatura de água (EMBASA) em nome de terceiro (Marcos Aurélio de Souza), sem declaração de coabitação ou contrato de aluguel conforme exigido no item 4.2.1.' },
      { tipo: 'PORTFOLIO', titulo: 'Portfolio_Antonio_Percussionista.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: true, observacao: 'Atuação cultural comprovada.' },
      { tipo: 'PROJETO', titulo: 'Plano_Aula_Percussao_Nordestina.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: true, observacao: 'Plano aprovado tecnicamente.' },
    ],
  },
  {
    numero: 'PNAB-2025-FORM-009',
    proponenteEmail: 'juliana.vocal@teste.com',
    categoria: 'Workshops de Música e Tradição Oral',
    status: 'INABILITADA',
    cotasOptIn: [],
    motivoInabilitacao: 'Documentação obrigatória incompleta ou ausente — Ausência de comprovação mínima de 2 anos de atuação cultural no município de Irecê (item 4.1.3 do Edital).',
    campos: {
      nome_completo: 'Juliana Mendes Pinheiro',
      telefone_contato: '(74) 99855-4422',
      email_contato: 'juliana.vocal@teste.com',
      nome_oficina: 'Técnica Vocal Aplicada ao Canto Popular e Regional',
      ementa: 'Fisiologia vocal, respiração diafragmática, afinação e interpretação de canções populares do sertão.',
      carga_horaria: 24,
      vagas_oferecidas: 20,
      local_realizacao: 'Auditório do Conservatório Musical de Irecê',
      publico_prioritario: ['Mulheres', 'Jovens de periferia'],
    },
    orcamento: [
      { item: 'Professora de Canto e Fonoaudióloga', quantidade: 1, valorUnitario: 5500, total: 5500 },
      { item: 'Material didático e apostilas vocais', quantidade: 1, valorUnitario: 2500, total: 2500 },
    ],
    anexos: [
      { tipo: 'DOCUMENTO_PESSOAL', titulo: 'Documento_RG_Juliana.pdf', url: 'https://pnab.irece.ba.gov.br/docs/documento-pessoal.pdf', valido: true, observacao: 'Documento oficial regular.' },
      { tipo: 'COMPROVANTE_ENDERECO', titulo: 'Comprovante_Residencia_Arnobio_Batista.pdf', url: 'https://pnab.irece.ba.gov.br/docs/comprovante-residencia.pdf', valido: true, observacao: 'Residência comprovada em Irecê há mais de 2 anos.' },
      { tipo: 'PORTFOLIO', titulo: 'Arquivo_Incompleto_Portfolio.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: false, observacao: 'Arquivo enviado possui apenas 1 página com recibo recente sem datas ou registros de atuações prévias a 2025.' },
      { tipo: 'PROJETO', titulo: 'Projeto_Tecnica_Vocal.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: true, observacao: 'Projeto adequado ao formato de workshop.' },
    ],
    recurso: {
      fase: 'HABILITACAO',
      texto: 'Venho por meio deste interpor recurso administrativo quanto à inabilitação da inscrição. Houve equívoco no envio do arquivo do portfólio em virtude de instabilidade na conexão no momento do upload. Solicito a juntada e deferimento do documento anexo comprobatório das apresentações e oficinas realizadas no Centro Cultural de Irecê nos anos de 2024 e 2025, sanando a exigência do subitem 4.1.3.',
      decisao: null,
      justificativa: null,
    },
  },
  {
    numero: 'PNAB-2025-FORM-010',
    proponenteEmail: 'sertaoemcena@teste.com',
    categoria: 'Oficinas de Artes Cênicas e Dança',
    status: 'INABILITADA',
    cotasOptIn: [],
    motivoInabilitacao: 'CPF/CNPJ irregular, inválido ou com pendências — Certidão Negativa de Débitos Tributários Municipais de Irecê com prazo de validade expirado e constatação de débitos ativos de ISSQN junto à Fazenda Municipal (item 4.3 do Edital).',
    campos: {
      nome_completo: 'Sertão em Cena Produções e Eventos Culturais LTDA',
      telefone_contato: '(74) 3641-7788',
      email_contato: 'sertaoemcena@teste.com',
      nome_oficina: 'Oficina de Teatro de Bonecos e Mamulengo Popular',
      ementa: 'Confecção de bonecos com cabaça e madeira leve, técnicas de manipulação e montagem de esquetes de mamulengo.',
      carga_horaria: 30,
      vagas_oferecidas: 25,
      local_realizacao: 'Teatro de Arena da Praça dos Requintes',
      publico_prioritario: ['Jovens de periferia', 'Idosos'],
    },
    orcamento: [
      { item: 'Equipe de bonequeiros e aderecistas', quantidade: 2, valorUnitario: 3000, total: 6000 },
      { item: 'Kits de cabaças, tecidos e tintas atóxicas', quantidade: 1, valorUnitario: 2000, total: 2000 },
    ],
    anexos: [
      { tipo: 'CNPJ_DOCUMENTO', titulo: 'Cartao_CNPJ_Sertao_em_Cena.pdf', url: 'https://pnab.irece.ba.gov.br/docs/cnpj.pdf', valido: true, observacao: 'CNPJ ativo.' },
      { tipo: 'CERTIDAO_MUNICIPAL', titulo: 'Certidao_Municipal_Vencida_2025.pdf', url: 'https://pnab.irece.ba.gov.br/docs/certidao.pdf', valido: false, observacao: 'Certidão apresentada está com validade vencida em 14/11/2025 e consulta tributária aponta débito ativo de ISSQN.' },
      { tipo: 'PORTFOLIO', titulo: 'Portfolio_Sertao_em_Cena.pdf', url: 'https://pnab.irece.ba.gov.br/docs/portfolio-cultural.pdf', valido: true, observacao: 'Comprovação artística excelente.' },
      { tipo: 'PROJETO', titulo: 'Plano_Trabalho_Mamulengo.pdf', url: 'https://pnab.irece.ba.gov.br/docs/plano-trabalho.pdf', valido: true, observacao: 'Proposta pedagógica completa.' },
    ],
  },
]
