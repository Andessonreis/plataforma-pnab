/**
 * Seed de Produção — Edital Cultura Viva
 *
 * Cria o edital real com todos os campos, critérios e tipos de anexo.
 * USO: npx tsx prisma/seed-production.ts
 *
 * Flags:
 *   --clean    Apaga TODOS os editais de teste antes de criar
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Campos do Formulário (Anexo 02) ─────────────────────────────────────────

const camposFormulario = [
  // ── Seção 1 — Dados da Entidade ──────────────────────────────────────────
  {
    nome: 'nome_entidade',
    label: 'Nome da Entidade/Coletivo Cultural',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: 'Nome completo da entidade',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'cnpj',
    label: 'CNPJ',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '00.000.000/0000-00',
    opcoes: [],
    hint: 'CNPJ ativo e regular',
  },
  {
    nome: 'endereco_entidade',
    label: 'Endereço Completo da Entidade',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: 'Rua, número, bairro, CEP, cidade, UF',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'telefone_entidade',
    label: 'Telefone de Contato',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '(00) 00000-0000',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'email_entidade',
    label: 'E-mail da Entidade',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: 'contato@entidade.org.br',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'redes_sociais',
    label: 'Páginas na Internet / Redes Sociais',
    tipo: 'textarea',
    obrigatorio: false,
    placeholder: 'Instagram, Facebook, site, etc.',
    opcoes: [],
    hint: '',
  },

  // ── Seção 2 — Certificação ───────────────────────────────────────────────
  {
    nome: 'certificada_ponto_cultura',
    label: 'Já é certificada como Ponto de Cultura?',
    tipo: 'select',
    obrigatorio: true,
    placeholder: '',
    opcoes: ['Sim', 'Não'],
    hint: 'Se sim, anexar certificação nos documentos',
  },
  {
    nome: 'link_certificacao',
    label: 'Link ou evidência da certificação',
    tipo: 'texto',
    obrigatorio: false,
    placeholder: 'URL do comprovante ou protocolo',
    opcoes: [],
    hint: 'Preencher apenas se certificada',
  },

  // ── Seção 3 — Dados do Representante Legal ───────────────────────────────
  {
    nome: 'nome_representante',
    label: 'Nome do Representante Legal',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: 'Nome completo (nome social, se aplicável)',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'apelido_artistico',
    label: 'Apelido artístico (se houver)',
    tipo: 'texto',
    obrigatorio: false,
    placeholder: '',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'cargo_funcao',
    label: 'Cargo/Função na Entidade',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: 'Ex: Presidente, Coordenador(a)',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'identidade_genero',
    label: 'Identidade de Gênero',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: [
      'Mulher cisgênero', 'Homem cisgênero', 'Mulher transgênero',
      'Homem transgênero', 'Não-binário', 'Travesti',
      'Outra', 'Prefiro não responder',
    ],
    hint: '',
  },
  {
    nome: 'orientacao_sexual',
    label: 'Orientação Sexual',
    tipo: 'select',
    obrigatorio: false,
    placeholder: 'Selecione',
    opcoes: [
      'Lésbica', 'Gay', 'Bissexual', 'Assexual',
      'Pansexual', 'Heterossexual', 'Outra', 'Prefiro não responder',
    ],
    hint: '',
  },
  {
    nome: 'pertencimento_etnico',
    label: 'Pertencimento a povos/comunidades tradicionais',
    tipo: 'multiselect',
    obrigatorio: false,
    placeholder: '',
    opcoes: [
      'Indígena', 'Quilombola', 'Ribeirinho(a)', 'Cigano(a)',
      'Comunidade de terreiro/matriz africana', 'LGBTQIAP+',
      'Pessoa com deficiência', 'Nenhum', 'Outro',
    ],
    hint: 'Marque todos que se aplicam',
  },
  {
    nome: 'pessoa_com_deficiencia',
    label: 'Pessoa com Deficiência?',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: ['Sim', 'Não'],
    hint: '',
  },
  {
    nome: 'tipo_deficiencia',
    label: 'Tipo de Deficiência',
    tipo: 'select',
    obrigatorio: false,
    placeholder: 'Selecione (se PcD)',
    opcoes: ['Auditiva', 'Física', 'Intelectual', 'Múltipla', 'Visual'],
    hint: 'Preencher apenas se PcD',
  },
  {
    nome: 'cpf_representante',
    label: 'CPF do Representante',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '000.000.000-00',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'rg_representante',
    label: 'RG do Representante',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Número e órgão expedidor',
  },
  {
    nome: 'data_nascimento',
    label: 'Data de Nascimento',
    tipo: 'data',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'endereco_representante',
    label: 'Endereço Pessoal Completo',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: 'Rua, número, bairro, CEP, cidade, UF',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'telefone_representante',
    label: 'Telefone Pessoal',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '(00) 00000-0000',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'email_representante',
    label: 'E-mail Pessoal',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'renda_principal_cultura',
    label: 'Sua renda principal vem de atividade cultural?',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: ['Sim', 'Não'],
    hint: '',
  },
  {
    nome: 'descricao_ocupacao_cultural',
    label: 'Descrição da ocupação cultural',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: 'Descreva sua atuação no campo cultural',
    opcoes: [],
    hint: '',
    maxLength: 500,
  },

  // ── Seção 4 — Experiência da Entidade ────────────────────────────────────
  {
    nome: 'tempo_atuacao',
    label: 'Há quanto tempo a entidade atua no setor cultural?',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: ['Menos de 3 anos', '3 a 5 anos', '6 a 10 anos', '10 a 15 anos', 'Mais de 15 anos'],
    hint: '',
  },
  {
    nome: 'espaco_recursos_suficientes',
    label: 'A entidade possui espaço e recursos suficientes para as atividades?',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: ['Sim', 'Não'],
    hint: '',
  },
  {
    nome: 'principais_desafios',
    label: 'Principais desafios enfrentados pela entidade',
    tipo: 'multiselect',
    obrigatorio: true,
    placeholder: '',
    opcoes: [
      'Administrativos', 'Estruturais', 'Geográficos', 'Econômicos',
      'Políticos', 'Sociais', 'Saúde', 'Parcerias', 'Formação/capacitação',
      'Desinteresse do público', 'Outro',
    ],
    hint: 'Marque todos que se aplicam',
  },
  {
    nome: 'areas_atuacao',
    label: 'Áreas de atuação da entidade',
    tipo: 'multiselect',
    obrigatorio: true,
    placeholder: '',
    opcoes: [
      'Centro urbano', 'Periferia urbana', 'Zona rural',
      'Território atingido por barragens', 'Território indígena',
      'Comunidade quilombola', 'Região de fronteira',
      'Área de vulnerabilidade social', 'Conjunto habitacional',
      'Região de baixo IDH', 'Região de alta violência',
    ],
    hint: '',
  },
  {
    nome: 'acoes_pncv',
    label: 'Ações alinhadas à Política Nacional de Cultura Viva',
    tipo: 'multiselect',
    obrigatorio: true,
    placeholder: '',
    opcoes: [
      'Intercâmbios', 'Livro/Leitura/Literatura', 'Comunicação/Mídia',
      'Educação', 'Memória/Patrimônio', 'Meio ambiente', 'Saúde',
      'Juventude', 'Saberes tradicionais', 'Cultura digital',
      'Direitos humanos', 'Economia criativa', 'Circo', 'Agente Cultura Viva',
    ],
    hint: '',
  },
  {
    nome: 'acoes_pncv_complementar',
    label: 'Ações complementares alinhadas à PNCV',
    tipo: 'multiselect',
    obrigatorio: false,
    placeholder: '',
    opcoes: [
      'Culturas indígenas', 'Culturas de matriz africana', 'Culturas populares',
      'Mestres(as) tradicionais', 'Mulheres', 'Hip Hop',
      'Linguagens artísticas', 'Acessibilidade', 'Cultura alimentar',
      'Gênero e diversidade', 'Territórios rurais', 'Direito à cidade',
    ],
    hint: '',
  },
  {
    nome: 'areas_conhecimento',
    label: 'Áreas e temas de conhecimento compartilhado',
    tipo: 'multiselect',
    obrigatorio: true,
    placeholder: '',
    opcoes: [
      'Antropologia', 'Artes visuais', 'Dança', 'Música', 'Teatro', 'Circo',
      'Design', 'Cinema/Audiovisual', 'Comunicação', 'Literatura', 'Gastronomia',
      'Artesanato', 'Moda', 'Fotografia', 'Patrimônio cultural', 'Museologia',
      'Educação popular', 'Meio ambiente', 'Saúde comunitária', 'Tecnologia/digital',
      'Economia solidária', 'Direitos humanos', 'Gestão cultural',
      'Produção cultural', 'Hip Hop', 'Grafite/Arte urbana',
      'Capoeira', 'Cultura de terreiro', 'Permacultura', 'Outra',
    ],
    hint: 'Marque todas que se aplicam',
  },
  {
    nome: 'publico_direto',
    label: 'Público diretamente atendido pela entidade',
    tipo: 'multiselect',
    obrigatorio: true,
    placeholder: '',
    opcoes: [
      'Afrodescendentes', 'Idosos(as)', 'Estudantes', 'Mulheres',
      'Populações rurais', 'Indígenas', 'LGBTQIAP+', 'Pessoas com deficiência',
      'Baixa renda', 'Pessoas em situação de rua', 'Pessoas privadas de liberdade',
      'Refugiados(as)', 'Pessoas em sofrimento psíquico', 'Vítimas de violência',
      'Atingidos por barragens', 'Crianças (0-11)', 'Adolescentes/Jovens (12-29)',
      'Adultos (30-59)', 'Artistas locais', 'Mestres(as) tradicionais',
      'Comunidade em geral', 'Outro',
    ],
    hint: '',
  },
  {
    nome: 'faixas_etarias',
    label: 'Faixas etárias atendidas',
    tipo: 'multiselect',
    obrigatorio: true,
    placeholder: '',
    opcoes: [
      'Primeira infância (0-6 anos)', 'Crianças (7-11 anos)',
      'Adolescentes/Jovens (12-29 anos)', 'Adultos (30-59 anos)',
      'Idosos (60+ anos)',
    ],
    hint: '',
  },
  {
    nome: 'audiencia_anual',
    label: 'Público estimado anual da entidade',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: [
      'Até 50 pessoas', '51 a 100 pessoas', '101 a 200 pessoas',
      '201 a 400 pessoas', '401 a 600 pessoas', 'Mais de 600 pessoas',
    ],
    hint: '',
  },

  // Perguntas dissertativas (itens 4.8 a 4.22 do Anexo 02)
  {
    nome: 'desc_atividades',
    label: '4.8) Descreva as atividades culturais desenvolvidas pela entidade',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'estrategias_criacao',
    label: '4.9) Estratégias para criação e produção artístico-cultural',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'uso_espacos',
    label: '4.10) Como a entidade utiliza espaços públicos e privados para ação cultural?',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'diversidade_intercultural',
    label: '4.11) Como a entidade promove diversidade cultural e diálogos interculturais?',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'inclusao_social',
    label: '4.12) Ações de inclusão de idosos, mulheres, jovens, negros, PcD, LGBTQIAP+ e baixa renda',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'autonomia_comunitaria',
    label: '4.13) Como a entidade contribui para o fortalecimento da autonomia comunitária?',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'intercambio_segmentos',
    label: '4.14) Intercâmbio entre diferentes segmentos da comunidade',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'articulacao_redes_educacao',
    label: '4.15) Articulação de redes sociais/culturais com a educação',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'gestao_compartilhada',
    label: '4.16) Princípios de gestão compartilhada entre sociedade civil e Estado',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'economia_solidaria_criativa',
    label: '4.17) Como a entidade fomenta economias solidária e criativa?',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'patrimonio_memoria',
    label: '4.18) Proteção do patrimônio cultural e memórias comunitárias',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'manifestacoes_tradicionais',
    label: '4.19) Apoio a manifestações culturais populares e tradicionais',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'atividades_gratuitas',
    label: '4.20) Atividades culturais gratuitas e abertas realizadas com regularidade',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'eixos_pncv',
    label: '4.21) Relação das ações com os eixos estruturantes da PNCV (formação, produção, difusão)',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },
  {
    nome: 'articulacao_politica',
    label: '4.22) Articulação com Frentes, Redes, Conselhos e Comissões da PNCV',
    tipo: 'textarea',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: 'Máximo 800 caracteres',
    maxLength: 800,
  },

  // ── Seção 5 — Dados Bancários ────────────────────────────────────────────
  {
    nome: 'banco_numero',
    label: 'Número do Banco',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: 'Ex: 001',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'banco_nome',
    label: 'Nome do Banco',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: 'Ex: Banco do Brasil',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'agencia',
    label: 'Número da Agência',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'tipo_conta',
    label: 'Tipo de Conta',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: ['Corrente', 'Poupança'],
    hint: 'Entidades: somente conta corrente no nome da entidade',
  },
  {
    nome: 'numero_conta',
    label: 'Número da Conta',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: '',
    opcoes: [],
    hint: '',
  },
  {
    nome: 'local_pagamento',
    label: 'Local de Pagamento',
    tipo: 'texto',
    obrigatorio: true,
    placeholder: 'Cidade/UF',
    opcoes: [],
    hint: '',
  },

  // ── Seção 6 — Declarações ────────────────────────────────────────────────
  {
    nome: 'aceite_declaracoes',
    label: 'Declaro que todas as informações prestadas são verdadeiras, que conheço e aceito as regras do edital, e que estou ciente de que a falsidade das declarações acarretará penalidades legais.',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione',
    opcoes: ['Sim, declaro e aceito'],
    hint: 'Leitura obrigatória do edital completo antes de aceitar',
  },
]

// ─── Tipos de Anexo ──────────────────────────────────────────────────────────

const tiposAnexo = [
  { tipo: 'PLANO_TRABALHO', label: 'Plano de Trabalho (Anexo 03)', obrigatorio: true },
  { tipo: 'PLANO_APLICACAO_RECURSOS', label: 'Plano de Aplicação de Recursos — XLSX (Anexo 04)', obrigatorio: true },
  { tipo: 'AUTODECL_ETNICO_RACIAL', label: 'Autodeclaração Étnico-Racial (Anexo 05)', obrigatorio: false },
  { tipo: 'AUTODECL_PCD', label: 'Autodeclaração PcD (Anexo 06)', obrigatorio: false },
  { tipo: 'DECLARACAO_CONJUNTA', label: 'Declaração Conjunta (Anexo 08)', obrigatorio: true },
  { tipo: 'DOCUMENTO_PESSOAL', label: 'Documento de Identificação do Representante', obrigatorio: true },
  { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Endereço da Entidade', obrigatorio: true },
  { tipo: 'PORTFOLIO_ENTIDADE', label: 'Portfólio / Comprovação de Atividades (mín. 3 anos)', obrigatorio: true },
  { tipo: 'ESTATUTO_ATA', label: 'Estatuto Social e Ata de Posse da Diretoria', obrigatorio: true },
]

// ─── Critérios de Avaliação (Anexo 01) ───────────────────────────────────────

const criteriosAvaliacao = [
  // Bloco 1 — Atuação da entidade cultural (18 critérios, máx 100 pts)
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1a) Representa iniciativas culturais já desenvolvidas por comunidades, grupos e redes de colaboração', descricao: 'Verificar portfólio, formulário e materiais enviados, conforme Lei nº 13.018/2014, art. 6º, I', notaMax: 10, peso: 10, modo: 'discreto', naoAtende: 0, parcial: 5, plenamente: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1b) Promove, amplia e garante a criação e a produção artística e cultural', descricao: '', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1c) Incentiva a preservação da cultura de Irecê', descricao: '', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1d) Estimula a exploração de espaços públicos e privados para ação cultural', descricao: '', notaMax: 2, peso: 2, modo: 'discreto', naoAtende: 0, parcial: 1, plenamente: 2 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1e) Aumenta a visibilidade das diversas iniciativas culturais', descricao: '', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1f) Promove a diversidade cultural brasileira, garantindo diálogos interculturais', descricao: '', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1g) Garante acesso aos meios de fruição, produção e difusão cultural', descricao: '', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1h) Assegura a inclusão cultural de idosos, mulheres, jovens, pessoas negras, PCD, LGBTQIAP+ e/ou de baixa renda', descricao: 'Combate às desigualdades sociais', notaMax: 4, peso: 4, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 4 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1i) Contribui para o fortalecimento da autonomia social das comunidades', descricao: '', notaMax: 10, peso: 10, modo: 'discreto', naoAtende: 0, parcial: 5, plenamente: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1j) Promove o intercâmbio entre diferentes segmentos da comunidade', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1k) Estimula a articulação das redes sociais e culturais e dessas com a educação', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1l) Adota princípios de gestão compartilhada entre atores culturais não governamentais e o Estado', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1m) Fomenta as economias solidária e criativa', descricao: '', notaMax: 4, peso: 4, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 4 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1n) Protege o patrimônio cultural material, imaterial e promove as memórias comunitárias', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1o) Apoia e incentiva manifestações culturais populares e tradicionais', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1p) Realiza atividades culturais gratuitas e abertas com regularidade na comunidade', descricao: '', notaMax: 10, peso: 10, modo: 'discreto', naoAtende: 0, parcial: 5, plenamente: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1q) Ações relacionadas aos eixos estruturantes da PNCV (formação, produção, difusão sociocultural continuada)', descricao: '', notaMax: 10, peso: 10, modo: 'discreto', naoAtende: 0, parcial: 5, plenamente: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1r) Articulação com outras organizações (Frentes, Redes, Conselhos, Comissões)', descricao: 'Participação e incidência política em áreas sinérgicas à PNCV', notaMax: 10, peso: 10, modo: 'discreto', naoAtende: 0, parcial: 5, plenamente: 10 },

  // Bloco 2-I — Efeitos artístico-culturais do projeto (12 critérios, máx 50 pts)
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-a) Contribui com a cidadania cultural e ampliação do acesso a bens e serviços culturais', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-b) Oficinas/ações formativas impactam com a ampliação de repertórios artísticos e culturais', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-c) Estratégias de acessibilidade promovem acesso e protagonismo de PCD', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-d) Estimula diversidade cultural e alteridade, promovendo protagonismo de grupos vulneráveis', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-e) Promove a expressividade e a criação estética', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-f) Prevê processos cooperativos e criativos continuados', descricao: 'Jogos, dinâmicas, experimentação, exercício estético, etc.', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-g) Contribui para uso protagonista das tecnologias digitais', descricao: 'Cultura digital, culturas populares em meios digitais, combate à desinformação', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-h) Ações contribuem com geração de trabalho e renda na comunidade', descricao: '', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-i) Fomenta crédito solidário, moedas sociais, equipamentos coletivos e comercialização solidária', descricao: 'Estúdios, ilhas de edição, feiras, lojas, portais, etc.', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-j) Impacta diferentes dimensões da vida social (educação, saúde, meio ambiente, segurança)', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-k) Estratégias efetivas de participação da comunidade na gestão do Ponto de Cultura', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-l) Promove atuação em rede do Ponto de Cultura para fortalecer base comunitária', descricao: '', notaMax: 3, peso: 3, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 3 },

  // Bloco 2-II — Execução e Plano de Trabalho (8 critérios, máx 35 pts)
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-a) Capacidade técnica, gerencial e operacional da entidade', descricao: 'Vinculação do portfólio com o projeto apresentado', notaMax: 4, peso: 4, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-b) Define metas razoáveis e exequíveis com ações e prazos', descricao: '', notaMax: 4, peso: 4, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-c) Prevê estratégias pertinentes em relação aos resultados pretendidos', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-d) Estratégias de divulgação específicas com democratização da informação', descricao: '', notaMax: 4, peso: 4, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-e) Estratégias e meios de verificação do cumprimento das metas', descricao: '', notaMax: 4, peso: 4, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-f) Equipe técnica adequada para realização do projeto', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-g) Clareza, coerência e razoabilidade entre ações e itens de despesa', descricao: '', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-h) Exequibilidade e viabilidade no prazo proposto', descricao: '', notaMax: 4, peso: 4, modo: 'discreto', naoAtende: 0, parcial: 2, plenamente: 4 },

  // Bloco 2-III — Abrangência do público beneficiário (6 critérios, máx 15 pts)
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-a) Estudantes da Rede Pública de ensino', descricao: '', notaMax: 2, peso: 2, modo: 'discreto', naoAtende: 0, parcial: 1, plenamente: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-b) Primeira Infância (crianças de 0 a 6 anos)', descricao: '', notaMax: 2, peso: 2, modo: 'discreto', naoAtende: 0, parcial: 1, plenamente: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-c) População de baixa renda, áreas com precária oferta de serviços públicos e cultura', descricao: 'Incluindo área rural', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 3, plenamente: 5 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-d) Pessoas com deficiência e/ou mobilidade reduzida', descricao: '', notaMax: 2, peso: 2, modo: 'discreto', naoAtende: 0, parcial: 1, plenamente: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-e) Povos Indígenas e Comunidades Tradicionais de Matriz Africana', descricao: '', notaMax: 2, peso: 2, modo: 'discreto', naoAtende: 0, parcial: 1, plenamente: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-f) Pessoas LGBTQIA+', descricao: '', notaMax: 2, peso: 2, modo: 'discreto', naoAtende: 0, parcial: 1, plenamente: 2 },

  // Bloco 3 — Bonificação (1 critério, máx 5 pts)
  { bloco: 'Bloco 3 — Bonificação', criterio: 'Bonificação — Autodeclaração negro(a), indígena ou PCD', descricao: 'Agente Cultural (representante) da entidade que se autodeclare, conforme Anexos 05 e/ou 06', notaMax: 5, peso: 5, modo: 'discreto', naoAtende: 0, parcial: 0, plenamente: 5 },
]

// ─── Regras de Desempate ─────────────────────────────────────────────────────

const desempate = [
  { descricao: 'Maior nota no Bloco 1 — Atuação da entidade cultural', tipo: 'bloco', ref: 'Bloco 1 — Atuação da entidade cultural', direcao: 'desc' },
  { descricao: 'Maior nota no Bloco 2-I — Efeitos artístico-culturais', tipo: 'bloco', ref: 'Bloco 2-I — Efeitos artístico-culturais do projeto', direcao: 'desc' },
  { descricao: 'Maior nota no Bloco 2-II — Execução e Plano de Trabalho', tipo: 'bloco', ref: 'Bloco 2-II — Execução e Plano de Trabalho', direcao: 'desc' },
  { descricao: 'Maior nota no Bloco 2-III — Abrangência do público', tipo: 'bloco', ref: 'Bloco 2-III — Abrangência do público beneficiário', direcao: 'desc' },
]

// ─── Cronograma (datas placeholder — secretaria ajusta depois) ───────────────

const cronograma = [
  { tipo: 'fase', fase: 'PUBLICADO', dataHora: '2026-05-01T00:00:00', destaque: false },
  { tipo: 'fase', fase: 'INSCRICOES_ABERTAS', dataHora: '2026-05-15T00:00:00', destaque: true },
  { tipo: 'fase', fase: 'INSCRICOES_ENCERRADAS', dataHora: '2026-06-30T23:59:59', destaque: true },
  { tipo: 'fase', fase: 'HABILITACAO', dataHora: '2026-07-15T00:00:00', destaque: false },
  { tipo: 'fase', fase: 'AVALIACAO', dataHora: '2026-08-01T00:00:00', destaque: false },
  { tipo: 'fase', fase: 'RESULTADO_PRELIMINAR', dataHora: '2026-08-15T00:00:00', destaque: true },
  { tipo: 'custom', label: 'Prazo de recursos (3 dias úteis)', dataHora: '2026-08-20T00:00:00', destaque: false },
  { tipo: 'fase', fase: 'RESULTADO_FINAL', dataHora: '2026-09-01T00:00:00', destaque: true },
  { tipo: 'fase', fase: 'ENCERRADO', dataHora: '2026-12-31T00:00:00', destaque: false },
]

// ─── Regras e Ações Afirmativas ──────────────────────────────────────────────

const regrasElegibilidade = [
  '• Ser Organização da Sociedade Civil (OSC) sem fins lucrativos, com CNPJ ativo e regular',
  '• Possuir mínimo de 3 anos de existência com comprovação de atuação cultural',
  '• Experiência prévia em objeto similar (atividades culturais comunitárias)',
  '• Capacidade técnica e operacional para execução do projeto',
  '• Não ser empresa com fins lucrativos, instituição de ensino, Sistema S, partido político ou fundação empresarial',
  '• Não ter membros da Comissão de Seleção ou seus parentes até 2º grau no quadro diretivo',
  '• Estar em dia com obrigações fiscais e trabalhistas',
].join('\n')

const acoesAfirmativas = [
  '• Bonificação de 5 pontos para entidades cujo representante legal se autodeclare negro(a), indígena ou PcD (mediante Anexos 05 e/ou 06)',
  '• Nota mínima de 50 pontos no Bloco 1 para certificação como Ponto de Cultura (entidades não certificadas)',
  '• Prioridade na seleção para propostas que contemplem comunidades tradicionais',
  '• Prioridade para projetos realizados em áreas de vulnerabilidade social, zona rural ou periferias',
].join('\n')

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const shouldClean = process.argv.includes('--clean')

  console.log('=== Seed de Produção — Edital Cultura Viva ===\n')

  if (shouldClean) {
    console.log('Limpando dados de teste...')
    // Ordem importa: dependências primeiro (FKs)
    await prisma.projetoApoiado.deleteMany()
    await prisma.recurso.deleteMany()
    await prisma.avaliacao.deleteMany()
    await prisma.anexoInscricao.deleteMany()
    await prisma.inscricao.deleteMany()
    await prisma.arquivoEdital.deleteMany()
    await prisma.editalMembro.deleteMany()
    await prisma.edital.deleteMany()
    console.log('  Editais e inscrições de teste removidos.\n')
  }

  // Criar/atualizar registros de AttachmentType para o Cultura Viva
  console.log('Cadastrando tipos de anexo no banco...')
  for (const tipo of tiposAnexo) {
    await prisma.attachmentType.upsert({
      where: { tipo: tipo.tipo },
      update: { label: tipo.label, obrigatorio: tipo.obrigatorio, tag: 'Cultura Viva' },
      create: { tipo: tipo.tipo, label: tipo.label, obrigatorio: tipo.obrigatorio, tag: 'Cultura Viva', isSystem: false },
    })
  }
  console.log(`  ${tiposAnexo.length} tipos de anexo cadastrados.\n`)

  // Verificar se o edital Cultura Viva já existe
  const existingSlug = 'chamamento-publico-cultura-viva-irece-2026'
  const existing = await prisma.edital.findUnique({ where: { slug: existingSlug } })

  if (existing) {
    console.log(`Edital Cultura Viva já existe (id: ${existing.id}). Atualizando...`)
    await prisma.edital.update({
      where: { id: existing.id },
      data: {
        camposFormulario: camposFormulario as unknown as Prisma.InputJsonValue,
        criteriosAvaliacao: criteriosAvaliacao as unknown as Prisma.InputJsonValue,
        tiposAnexo: tiposAnexo as unknown as Prisma.InputJsonValue,
        desempate: desempate as unknown as Prisma.InputJsonValue,
        cronograma: cronograma as unknown as Prisma.InputJsonValue,
        formulaAvaliacao: '((B1+B2)/2)+B3',
        regrasElegibilidade,
        acoesAfirmativas,
        tiposProponentePermitidos: ['PJ'],
        notaMinima: 3.0,
        vagasContemplados: 1,
      },
    })
    console.log('  Edital atualizado com sucesso.\n')
  } else {
    console.log('Criando Edital Cultura Viva...')
    const edital = await prisma.edital.create({
      data: {
        titulo: 'Chamamento Público — Rede Municipal de Pontos de Cultura de Irecê',
        slug: existingSlug,
        ano: 2026,
        status: 'RASCUNHO',
        resumo: 'Chamamento público para seleção de entidade cultural a ser certificada e fomentada como Ponto de Cultura no município de Irecê/BA, no âmbito da Política Nacional de Cultura Viva (PNCV). Valor: R$ 90.000,00. Duração: 12 meses.',
        valorTotal: 90000,
        categorias: [],
        regrasElegibilidade,
        acoesAfirmativas,
        tiposProponentePermitidos: ['PJ'],
        cronograma: cronograma as unknown as Prisma.InputJsonValue,
        camposFormulario: camposFormulario as unknown as Prisma.InputJsonValue,
        criteriosAvaliacao: criteriosAvaliacao as unknown as Prisma.InputJsonValue,
        formulaAvaliacao: '((B1+B2)/2)+B3',
        tiposAnexo: tiposAnexo as unknown as Prisma.InputJsonValue,
        notaMinima: 3.0,
        desempate: desempate as unknown as Prisma.InputJsonValue,
        vagasContemplados: 1,
        vagasSuplentes: null,
      },
    })
    console.log(`  Edital criado com sucesso! (id: ${edital.id}, slug: ${edital.slug})\n`)
  }

  console.log('Resumo:')
  console.log(`  Campos do formulário: ${camposFormulario.length}`)
  console.log(`  Critérios de avaliação: ${criteriosAvaliacao.length}`)
  console.log(`  Tipos de anexo: ${tiposAnexo.length}`)
  console.log(`  Fórmula: ((B1+B2)/2)+B3`)
  console.log(`  Nota mínima: 3.0 (≡ 60/200)`)
  console.log(`  Tipos permitidos: PJ`)
  console.log(`  Vagas: 1 contemplado`)
  console.log(`  Status: RASCUNHO (alterar no painel admin quando pronto)\n`)

  console.log('Próximos passos:')
  console.log('  1. Acesse /admin/editais e ajuste o cronograma com as datas reais')
  console.log('  2. Faça upload dos PDFs dos anexos (seção Documentos e Arquivos)')
  console.log('  3. Mude o status para INSCRICOES_ABERTAS quando pronto')
  console.log('')
}

main()
  .catch(e => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
