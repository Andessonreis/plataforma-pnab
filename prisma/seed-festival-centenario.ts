/**
 * Seed de Produção — Edital de Chamamento Público Nº 02/2026
 * Festival de Arte e Cultura de Irecê — Centenário da Cidade
 *
 * Fonte: novo_edita/20.07 EDITAL FESTIVAL DE AC DE IRECÊ.docx
 * USO: npx tsx prisma/seed-festival-centenario.ts
 *
 * Flags:
 *   --clean    Remove um edital existente com o mesmo slug antes de criar
 */

import { PrismaClient, type Prisma } from '@prisma/client'
import type { CategoriaConfig } from '../src/types/categoria-config'

const prisma = new PrismaClient()

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

// ─── Categorias, vagas, cotas e valor (Anexo I) ──────────────────────────────
// Duas cotas reservadas em todo o edital: pessoas negras e indígenas/PCD
// (combinadas em uma única coluna no Anexo I).

const categoriasConfig: CategoriaConfig[] = [
  { nome: 'Atividades de Formação/Curso', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 28000 },
  { nome: 'Música I', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 15000, valorTotalCategoria: 45000 },
  { nome: 'Música II', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 1 }], valorPorProjeto: 7000, valorTotalCategoria: 35000 },
  { nome: 'Sinfônicas e Filarmônicas', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 14000 },
  { nome: 'Arte Visual/Exposição', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 21000 },
  { nome: 'Dança I', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 5000, valorTotalCategoria: 10000 },
  { nome: 'Economia Criativa/Feiras e/ou Mostras', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 20000, valorTotalCategoria: 40000 },
  { nome: 'Teatro', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 10000, valorTotalCategoria: 30000 },
  { nome: 'Poesia/Sarau', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 3000, valorTotalCategoria: 6000 },
  { nome: 'Literatura/Publicação Livro', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 15000, valorTotalCategoria: 30000 },
  { nome: 'Audiovisual/Cinema', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 2000, valorTotalCategoria: 8000 },
  { nome: 'Cultura Popular', vagasAmplaConcorrencia: 3, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 1 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 5000, valorTotalCategoria: 20000 },
  { nome: 'Cultura Hip Hop/Grafite', vagasAmplaConcorrencia: 2, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 7000, valorTotalCategoria: 14000 },
  { nome: 'Cultura Hip Hop/Batalha de Rua', vagasAmplaConcorrencia: 1, cotas: [{ key: 'negros', label: 'Cotas Pessoas Negras', vagas: 0 }, { key: 'indigena_pcd', label: 'Cotas Indígenas e/ou PCD', vagas: 0 }], valorPorProjeto: 5000, valorTotalCategoria: 5000 },
  { nome: 'Outros Serviços de Terceiros - Pessoa Jurídica', vagasAmplaConcorrencia: null, cotas: [], valorPorProjeto: null, valorTotalCategoria: 60272.49 },
]

const categorias = categoriasConfig.map((c) => c.nome)

// ─── Campos do formulário (etapa "Dados") — identificação básica ─────────────

const camposFormulario = [
  { nome: 'nome_completo', label: 'Nome completo do proponente', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
  { nome: 'telefone_contato', label: 'Telefone/WhatsApp de contato', tipo: 'texto', obrigatorio: true, placeholder: '(74) 90000-0000', opcoes: [], hint: '' },
  { nome: 'email_contato', label: 'E-mail de contato', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
]

// ─── Etapas customizadas — Plano de Trabalho (Anexo VII) e Planilha Orçamentária (Anexo VIII)

const etapasCustomizadas = [
  {
    id: 'plano-de-trabalho',
    titulo: 'Plano de Trabalho',
    descricao: 'Conforme Anexo VII do edital — descreva sua proposta artístico-cultural.',
    ordem: 0,
    campos: [
      { nome: 'nome_projeto', label: 'Nome do Projeto', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      { nome: 'descricao_projeto', label: 'Descrição do projeto', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'O que você realizará com o projeto? Por que ele é importante? Como surgiu a ideia?', maxLength: 1500 },
      { nome: 'metas', label: 'Metas', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Detalhe os objetivos em ações e/ou resultados quantificáveis. Ex.: Realização de 2 oficinas; 120 pessoas beneficiadas.', maxLength: 800 },
      { nome: 'perfil_publico', label: 'Perfil do público a ser atingido', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Quem vai ser o público? Crianças, adultos, idosos? Fazem parte de alguma comunidade? Onde moram?' },
      {
        nome: 'publico_prioritario', label: 'Sua ação cultural é voltada prioritariamente para algum destes perfis?', tipo: 'multiselect', obrigatorio: false, placeholder: '', hint: 'Marque todos que se aplicam',
        opcoes: [
          'Pessoas vítimas de violência', 'Pessoas em situação de pobreza', 'Pessoas em situação de rua',
          'Pessoas em situação de restrição e privação de liberdade', 'Pessoas com deficiência',
          'Pessoas em sofrimento físico e/ou psíquico', 'Mulheres', 'LGBTQIAPN+',
          'Povos e comunidades tradicionais', 'Negros e/ou negras', 'Ciganos', 'Indígenas',
          'Não é voltada especificamente para um perfil, é aberta para todos', 'Outros',
        ],
      },
      { nome: 'objetivos', label: 'Objetivos do projeto', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Proponha entre 3 e 5 objetivos.' },
      {
        nome: 'acessibilidade_arquitetonica', label: 'Medidas de acessibilidade arquitetônica', tipo: 'multiselect', obrigatorio: false, placeholder: '', hint: '',
        opcoes: [
          'Rotas acessíveis com espaço de manobra para cadeira de rodas', 'Piso tátil', 'Rampas',
          'Elevadores adequados para PCD', 'Corrimãos e guarda-corpos', 'Banheiros adaptados',
          'Vagas de estacionamento para PCD', 'Assentos para pessoas obesas', 'Iluminação adequada', 'Outra',
        ],
      },
      {
        nome: 'acessibilidade_comunicacional', label: 'Medidas de acessibilidade comunicacional', tipo: 'multiselect', obrigatorio: false, placeholder: '', hint: '',
        opcoes: ['Língua Brasileira de Sinais (Libras)', 'Sistema Braille', 'Sinalização/comunicação tátil', 'Audiodescrição', 'Legendas', 'Linguagem simples', 'Textos adaptados para leitores de tela', 'Outra'],
      },
      {
        nome: 'acessibilidade_atitudinal', label: 'Medidas de acessibilidade atitudinal', tipo: 'multiselect', obrigatorio: false, placeholder: '', hint: '',
        opcoes: ['Capacitação de equipes atuantes nos projetos culturais', 'Contratação de profissionais com deficiência e especializados em acessibilidade cultural', 'Formação e sensibilização de agentes culturais e público', 'Outras medidas de eliminação de atitudes capacitistas'],
      },
      { nome: 'acessibilidade_detalhamento', label: 'Detalhe como as medidas de acessibilidade serão implementadas', tipo: 'textarea', obrigatorio: false, placeholder: '', opcoes: [], hint: '' },
      { nome: 'local_execucao', label: 'Local onde o projeto será executado', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Espaços culturais e outros ambientes' },
      { nome: 'data_inicio_execucao', label: 'Data de início prevista', tipo: 'data', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      { nome: 'data_fim_execucao', label: 'Data final prevista', tipo: 'data', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      {
        nome: 'equipe', label: 'Equipe do projeto', tipo: 'tabela', obrigatorio: false, linhaMin: 0,
        colunas: [
          { nome: 'nome', label: 'Nome do profissional/empresa', tipo: 'texto', obrigatorio: true },
          { nome: 'funcao', label: 'Função no projeto', tipo: 'texto', obrigatorio: true },
          { nome: 'cpf_cnpj', label: 'CPF/CNPJ', tipo: 'texto', obrigatorio: false },
          { nome: 'mini_curriculo', label: 'Mini currículo', tipo: 'textarea', obrigatorio: false },
        ],
      },
      {
        nome: 'cronograma_execucao', label: 'Cronograma de execução', tipo: 'tabela', obrigatorio: true, linhaMin: 1,
        colunas: [
          { nome: 'atividade', label: 'Atividade', tipo: 'texto', obrigatorio: true },
          { nome: 'etapa', label: 'Etapa', tipo: 'texto', obrigatorio: true },
          { nome: 'descricao', label: 'Descrição', tipo: 'textarea', obrigatorio: false },
          { nome: 'inicio', label: 'Início', tipo: 'data', obrigatorio: true },
          { nome: 'fim', label: 'Fim', tipo: 'data', obrigatorio: true },
        ],
      },
      { nome: 'estrategia_divulgacao', label: 'Estratégia de divulgação', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Ex.: impulsionamento em redes sociais.' },
      {
        nome: 'outras_fontes', label: 'O projeto possui recursos financeiros de outras fontes?', tipo: 'multiselect', obrigatorio: false, placeholder: '', hint: '',
        opcoes: [
          'Não possui outras fontes', 'Apoio financeiro municipal', 'Apoio financeiro estadual',
          'Recursos de Lei de Incentivo Municipal', 'Recursos de Lei de Incentivo Estadual', 'Recursos de Lei de Incentivo Federal',
          'Patrocínio privado direto', 'Patrocínio de instituição internacional', 'Doações de Pessoas Físicas',
          'Doações de Empresas', 'Cobrança de ingressos', 'Outros',
        ],
      },
      { nome: 'detalhamento_outras_fontes', label: 'Detalhe as outras fontes (valor e onde os recursos serão empregados)', tipo: 'textarea', obrigatorio: false, placeholder: '', opcoes: [], hint: '' },
      { nome: 'venda_produtos', label: 'O projeto prevê venda de produtos/ingressos?', tipo: 'textarea', obrigatorio: false, placeholder: '', opcoes: [], hint: 'Informe quantidade, valor unitário, valor total e onde os recursos serão aplicados.' },
    ],
  },
  {
    id: 'planilha-orcamentaria',
    titulo: 'Planilha Orçamentária',
    descricao: 'Conforme Anexo VIII do edital — detalhe todas as despesas do projeto.',
    ordem: 1,
    campos: [
      {
        nome: 'planilha_orcamentaria', label: 'Itens de despesa', tipo: 'tabela', obrigatorio: true, linhaMin: 1,
        colunas: [
          { nome: 'descricao_item', label: 'Descrição do item', tipo: 'texto', obrigatorio: true },
          { nome: 'justificativa', label: 'Justificativa', tipo: 'textarea', obrigatorio: true },
          { nome: 'unidade_medida', label: 'Unidade de medida', tipo: 'texto', obrigatorio: true },
          { nome: 'valor_unitario', label: 'Valor unitário (R$)', tipo: 'numero', obrigatorio: true },
          { nome: 'quantidade', label: 'Quantidade', tipo: 'numero', obrigatorio: true },
          { nome: 'valor_total', label: 'Valor total (R$)', tipo: 'numero', obrigatorio: true },
          { nome: 'referencia_preco', label: 'Referência de preço (opcional)', tipo: 'texto', obrigatorio: false },
        ],
      },
    ],
  },
]

// ─── Critérios de avaliação (Anexo VI) ───────────────────────────────────────
// 5 critérios obrigatórios somando 100 pontos + bloco de bonificação (até 15,
// mas o edital limita a contagem a até 2 itens de bônus — não é imposto
// automaticamente pelo sistema, precisa ser respeitado manualmente pela comissão).

const criteriosAvaliacao = [
  { bloco: 'Bloco 1 — Critérios Obrigatórios', criterio: 'A) Qualidade do Projeto', descricao: 'Coerência do objeto, objetivos, justificativa e metas do projeto.', notaMax: 30, peso: 30, modo: 'slider' as const },
  { bloco: 'Bloco 1 — Critérios Obrigatórios', criterio: 'B) Coerência da planilha orçamentária e do cronograma de execução', descricao: 'Viabilidade técnica dos gastos previstos frente ao objeto, metas e objetivos.', notaMax: 20, peso: 20, modo: 'slider' as const },
  { bloco: 'Bloco 1 — Critérios Obrigatórios', criterio: 'C) Análise curricular do proponente e da ficha técnica', descricao: 'Coerência entre a carreira dos profissionais e as atribuições que executarão no projeto.', notaMax: 20, peso: 20, modo: 'slider' as const },
  { bloco: 'Bloco 1 — Critérios Obrigatórios', criterio: 'D) Relevância da ação proposta para o cenário cultural de Irecê', descricao: 'Aspectos de integração comunitária, enriquecimento e valorização da cultura de Irecê.', notaMax: 20, peso: 20, modo: 'slider' as const },
  { bloco: 'Bloco 1 — Critérios Obrigatórios', criterio: 'E) Coerência do Plano de Divulgação', descricao: 'Viabilidade técnica e comunicacional com o público-alvo do projeto.', notaMax: 10, peso: 10, modo: 'slider' as const },
  { bloco: 'Bloco 2 — Bonificação', criterio: 'Bonificação — Gênero feminino ou LGBTQIA+', descricao: 'Máx. 2 itens de bônus contam pra pontuação final (ver Anexo VI) — checar manualmente.', notaMax: 5, peso: 5, modo: 'discreto' as const, naoAtende: 0, plenamente: 5 },
  { bloco: 'Bloco 2 — Bonificação', criterio: 'Bonificação — Agente cultural negro(a) ou indígena', descricao: '', notaMax: 5, peso: 5, modo: 'discreto' as const, naoAtende: 0, plenamente: 5 },
  { bloco: 'Bloco 2 — Bonificação', criterio: 'Bonificação — Pessoa com deficiência', descricao: '', notaMax: 5, peso: 5, modo: 'discreto' as const, naoAtende: 0, plenamente: 5 },
]

// Bloco 1 (0-100) e Bloco 2 (0-15) escalados a /10 pra ficar na mesma escala
// 0-10 usada por notaMinima em todo o sistema (40/100 do edital = 4.0 aqui).
const formulaAvaliacao = '(B1/10)+(B2/10)'
const notaMinima = 4.0

const desempate = [
  { descricao: 'Maior nota no critério A (Qualidade do Projeto)', tipo: 'criterio' as const, ref: 'A) Qualidade do Projeto', direcao: 'desc' as const },
  { descricao: 'Maior nota no critério B (Coerência orçamentária/cronograma)', tipo: 'criterio' as const, ref: 'B) Coerência da planilha orçamentária e do cronograma de execução', direcao: 'desc' as const },
  { descricao: 'Maior nota no critério C (Análise curricular)', tipo: 'criterio' as const, ref: 'C) Análise curricular do proponente e da ficha técnica', direcao: 'desc' as const },
  { descricao: 'Maior nota no critério D (Relevância da ação)', tipo: 'criterio' as const, ref: 'D) Relevância da ação proposta para o cenário cultural de Irecê', direcao: 'desc' as const },
  { descricao: 'Maior nota no critério E (Plano de divulgação)', tipo: 'criterio' as const, ref: 'E) Coerência do Plano de Divulgação', direcao: 'desc' as const },
  // Tempo de comprovação profissional / maior idade — critério de desempate
  // final não automatizável, decidido manualmente pela comissão.
]

// ─── Tipos de anexo (item 4.1 + Anexos II a V) ───────────────────────────────

const tiposAnexo = [
  { tipo: 'PORTFOLIO', label: 'Portfólio (comprovação dos últimos 2 anos de atuação)', obrigatorio: true },
  { tipo: 'DOCUMENTO_PESSOAL', label: 'Documento pessoal (RG e CPF)', obrigatorio: true },
  { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de Residência (Anexo II)', obrigatorio: true },
  { tipo: 'CNPJ_DOCUMENTO', label: 'CNPJ (quando pessoa jurídica)', obrigatorio: false },
  { tipo: 'AUTODECL_ETNICO_RACIAL', label: 'Autodeclaração Étnico-Racial (Anexo III)', obrigatorio: false },
  { tipo: 'AUTODECL_PCD', label: 'Autodeclaração PCD (Anexo IV)', obrigatorio: false },
  { tipo: 'DECLARACAO_REPRESENTACAO_GRUPO', label: 'Declaração de Representação de Grupo/Coletivo (Anexo V)', obrigatorio: false },
]

// ─── Cronograma ───────────────────────────────────────────────────────────────
// Datas exatamente como no edital (item 3.5). NOTA: a Seleção/Avaliação
// (03 a 13/09) acontece ANTES da Habilitação (21 a 29/09) neste edital —
// invertido em relação à ordem que o sistema assume (Habilitação → Avaliação).
// Ver aviso no relatório final sobre como operar isso no painel.

const cronograma = [
  { tipo: 'custom' as const, label: 'Publicação do Edital', dataHora: '2026-07-25T00:00:00', fimEm: '2026-07-27T23:59:00', acao: 'RECURSO_EDITAL_JANELA' as const },
  { tipo: 'fase' as const, fase: 'INSCRICOES_ABERTAS' as const, dataHora: '2026-07-28T00:00:00' },
  { tipo: 'fase' as const, fase: 'INSCRICOES_ENCERRADAS' as const, dataHora: '2026-08-27T23:59:00' },
  { tipo: 'custom' as const, label: 'Publicação dos Inscritos', dataHora: '2026-08-28T00:00:00' },
  { tipo: 'custom' as const, label: 'Período para recursos — inscrições', dataHora: '2026-08-31T00:00:00', fimEm: '2026-09-02T23:59:00' },
  { tipo: 'custom' as const, label: 'Publicação dos Inscritos após recurso', dataHora: '2026-09-03T00:00:00', acao: 'PUBLICACAO_INSCRITOS' as const },
  { tipo: 'fase' as const, fase: 'AVALIACAO' as const, dataHora: '2026-09-03T00:00:00' },
  { tipo: 'custom' as const, label: 'Publicação dos Projetos Selecionados', dataHora: '2026-09-14T00:00:00' },
  { tipo: 'custom' as const, label: 'Período para recursos — seleção', dataHora: '2026-09-09T00:00:00', fimEm: '2026-09-11T23:59:00' },
  { tipo: 'custom' as const, label: 'Resultado Final dos Projetos Selecionados após recurso', dataHora: '2026-09-18T00:00:00' },
  { tipo: 'fase' as const, fase: 'HABILITACAO' as const, dataHora: '2026-09-21T00:00:00' },
  { tipo: 'custom' as const, label: 'Publicação dos Projetos Habilitados', dataHora: '2026-09-30T00:00:00', acao: 'PUBLICACAO_HABILITADOS' as const },
  { tipo: 'custom' as const, label: 'Período para recursos — habilitação', dataHora: '2026-10-01T00:00:00', fimEm: '2026-10-05T23:59:00', acao: 'RECURSO_HABILITACAO_JANELA' as const },
  { tipo: 'custom' as const, label: 'Publicação dos Projetos Habilitados após recurso', dataHora: '2026-10-06T00:00:00', acao: 'PUBLICACAO_HABILITADOS_POS_RECURSOS' as const },
  { tipo: 'custom' as const, label: 'Assinatura do Termo de Execução Cultural (TEC)', dataHora: '2026-10-06T00:00:00', fimEm: '2026-10-09T23:59:00' },
  { tipo: 'custom' as const, label: 'Convocação de Suplentes', dataHora: '2026-10-13T00:00:00' },
  { tipo: 'custom' as const, label: 'Assinatura do TEC pelos Suplentes', dataHora: '2026-10-14T00:00:00', fimEm: '2026-10-16T23:59:00' },
  { tipo: 'fase' as const, fase: 'ENCERRADO' as const, dataHora: '2026-11-15T23:59:00' },
]

// ─── Regras de elegibilidade e ações afirmativas ─────────────────────────────

const regrasElegibilidade = [
  '• Pessoa física ou MEI, maiores de 18 anos',
  '• Residentes do município de Irecê com declaração de residência de no mínimo 2 anos (Anexo II)',
  '• Pessoa jurídica sem fins lucrativos (associação, fundação, cooperativa etc.)',
  '• Pessoa jurídica com fins lucrativos com comprovação artístico-cultural',
  '• Coletivo/grupo sem CNPJ representado por pessoa física (Anexo V)',
  '• Vedado: quem participou da elaboração/análise/julgamento de recursos deste edital',
  '• Vedado: Chefe do Poder Executivo, Secretário, membros do Legislativo/Judiciário/Tribunal de Contas/Ministério Público',
  '• Vedado: menores de 18 anos, inadimplentes com o município, servidores da SECULT',
].join('\n')

const acoesAfirmativas = [
  '• Cotas garantidas em todas as categorias para pessoas negras (pretas e pardas), indígenas e pessoas com deficiência (ver quadro de vagas)',
  '• Concorrência concomitante: cotistas concorrem simultaneamente às vagas de ampla concorrência',
  '• Remanejamento: vagas de cota não preenchidas por falta de optantes voltam para a ampla concorrência',
  '• Bônus de pontuação para gênero feminino/LGBTQIA+, agentes negros/indígenas e pessoas com deficiência (Anexo VI)',
].join('\n')

// ═══════════════════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const shouldClean = process.argv.includes('--clean')
  const slug = 'festival-arte-cultura-irece-centenario-2026'

  console.log('=== Seed — Festival de Arte e Cultura de Irecê (Centenário) ===\n')

  const existing = await prisma.edital.findUnique({ where: { slug } })
  if (existing && shouldClean) {
    console.log('Removendo edital existente (--clean)...')
    await prisma.projetoApoiado.deleteMany({ where: { inscricao: { editalId: existing.id } } })
    await prisma.recurso.deleteMany({ where: { inscricao: { editalId: existing.id } } })
    await prisma.avaliacao.deleteMany({ where: { inscricao: { editalId: existing.id } } })
    await prisma.anexoInscricao.deleteMany({ where: { inscricao: { editalId: existing.id } } })
    await prisma.inscricao.deleteMany({ where: { editalId: existing.id } })
    await prisma.arquivoEdital.deleteMany({ where: { editalId: existing.id } })
    await prisma.editalMembro.deleteMany({ where: { editalId: existing.id } })
    await prisma.edital.delete({ where: { id: existing.id } })
    console.log('  Removido.\n')
  }

  console.log('Cadastrando categorias culturais no catálogo...')
  for (const [i, nome] of categorias.entries()) {
    const catSlug = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    await prisma.category.upsert({
      where: { nome },
      update: { slug: catSlug, ativa: true, ordem: i },
      create: { nome, slug: catSlug, ativa: true, ordem: i, isSystem: false },
    })
  }
  console.log(`  ${categorias.length} categorias cadastradas.\n`)

  console.log('Cadastrando tipos de anexo no banco...')
  for (const tipo of tiposAnexo) {
    await prisma.attachmentType.upsert({
      where: { tipo: tipo.tipo },
      update: { label: tipo.label, obrigatorio: tipo.obrigatorio, tag: 'Festival Centenário' },
      create: { tipo: tipo.tipo, label: tipo.label, obrigatorio: tipo.obrigatorio, tag: 'Festival Centenário', isSystem: false },
    })
  }
  console.log(`  ${tiposAnexo.length} tipos de anexo cadastrados.\n`)

  const stillExisting = await prisma.edital.findUnique({ where: { slug } })
  if (stillExisting) {
    console.log(`Edital já existe (id: ${stillExisting.id}). Atualizando...`)
    await prisma.edital.update({
      where: { id: stillExisting.id },
      data: {
        categorias,
        categoriasConfig: toJson(categoriasConfig),
        camposFormulario: toJson(camposFormulario),
        etapasCustomizadas: toJson(etapasCustomizadas),
        criteriosAvaliacao: toJson(criteriosAvaliacao),
        formulaAvaliacao,
        tiposAnexo: toJson(tiposAnexo),
        notaMinima,
        desempate: toJson(desempate),
        cronograma: toJson(cronograma),
        regrasElegibilidade,
        acoesAfirmativas,
        tiposProponentePermitidos: [],
        vagasContemplados: null,
        vagasSuplentes: null,
        videoHabilitado: true,
      },
    })
    console.log('  Edital atualizado com sucesso.\n')
  } else {
    console.log('Criando edital...')
    const edital = await prisma.edital.create({
      data: {
        titulo: 'Festival de Arte e Cultura de Irecê — Centenário da Cidade',
        slug,
        ano: 2026,
        status: 'RASCUNHO',
        resumo: 'Edital de Chamamento Público Nº 02/2026 para seleção de artistas e agentes culturais pra compor a programação do Festival de Arte e Cultura de Irecê — Ano do Centenário. Valor total: R$ 360.272,49, distribuído em 15 categorias/linguagens artísticas.',
        valorTotal: 360272.49,
        categorias,
        categoriasConfig: toJson(categoriasConfig),
        regrasElegibilidade,
        acoesAfirmativas,
        tiposProponentePermitidos: [],
        cronograma: toJson(cronograma),
        camposFormulario: toJson(camposFormulario),
        etapasCustomizadas: toJson(etapasCustomizadas),
        criteriosAvaliacao: toJson(criteriosAvaliacao),
        formulaAvaliacao,
        tiposAnexo: toJson(tiposAnexo),
        notaMinima,
        desempate: toJson(desempate),
        vagasContemplados: null,
        vagasSuplentes: null,
        videoHabilitado: true,
      },
    })
    console.log(`  Edital criado com sucesso! (id: ${edital.id}, slug: ${edital.slug})\n`)
  }

  console.log('Resumo:')
  console.log(`  Categorias: ${categorias.length}`)
  console.log(`  Vagas totais (Anexo I): 39 (31 ampla + 7 cota negros + 1 cota indígena/PCD)`)
  console.log(`  Critérios de avaliação: ${criteriosAvaliacao.length} (5 obrigatórios + 3 bônus)`)
  console.log(`  Fórmula: ${formulaAvaliacao}`)
  console.log(`  Nota mínima: ${notaMinima} (≡ 40/100 do edital)`)
  console.log(`  Tipos de anexo: ${tiposAnexo.length}`)
  console.log(`  Tipos permitidos: todos (PF, MEI, PJ, COLETIVO)`)
  console.log(`  Status: RASCUNHO (alterar no painel admin quando pronto)\n`)

  console.log('⚠️  Divergências encontradas no documento original (não corrigidas automaticamente):')
  console.log('  1. Soma dos valores por categoria no Anexo I dá R$ 366.272,49, mas o edital declara')
  console.log('     valor total de R$ 360.272,49 (diferença de R$ 6.000,00) — conferir com a SECULT qual está certo.')
  console.log('  2. Item 2.2 do cronograma ("Período para recursos", 09 a 11/09) aparece ANTES da')
  console.log('     publicação dos selecionados (item 2.1, 14/09) no próprio texto do edital — mantive as')
  console.log('     datas literais, mas a ordem parece um erro de digitação do documento original.')
  console.log('  3. Neste edital a Seleção/Avaliação (03 a 13/09) acontece ANTES da Habilitação')
  console.log('     documental (21 a 29/09) — invertido em relação à ordem que o sistema assume')
  console.log('     (Habilitação → Avaliação). Operacionalmente: marquem as inscrições selecionadas como')
  console.log('     habilitadas manualmente pra rodar a avaliação, e tratem a habilitação documental')
  console.log('     (item 3 do edital) como conferência manual à parte — o sistema não tem um segundo')
  console.log('     "gate" de habilitação pós-seleção.')
  console.log('  4. O limite de "até 2 itens de bônus contam" (Anexo VI) não é aplicado automaticamente')
  console.log('     pelo sistema — a comissão precisa respeitar isso manualmente ao pontuar.\n')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
