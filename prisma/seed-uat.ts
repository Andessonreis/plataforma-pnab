/**
 * Seed UAT — Ambiente de pré-produção para testes dos bolsistas
 *
 * Objetivo: popular o banco com dados realistas e densos para que cada
 * bolsista encontre TRABALHO NA SUA ROLE assim que logar — sem precisar
 * que alguém "prepare" o cenário.
 *
 * Rodar após o seed principal:
 *   npm run db:seed && npm run db:seed:uat
 *
 * O que este seed cria:
 *
 * Usuários (33)
 *   • 19 bolsistas testadores com nome real
 *   • 11 placeholders (user01..user11) pra Fase 2 / extras
 *   • 15 proponentes fantasma (nomes fictícios de artistas) pra dar
 *     volume nas filas de habilitação e avaliação
 *
 * Editais (≥8 novos, além dos que já vêm do seed principal)
 *   Cobre TODAS as fases do ciclo de vida:
 *     RASCUNHO → PUBLICADO → INSCRICOES_ABERTAS → INSCRICOES_ENCERRADAS →
 *     HABILITACAO → AVALIACAO → RESULTADO_PRELIMINAR → RECURSO →
 *     RESULTADO_FINAL → ENCERRADO
 *
 * Inscrições (~60)
 *   Em todos os status: RASCUNHO, ENVIADA, HABILITADA, INABILITADA,
 *   EM_AVALIACAO, RESULTADO_PRELIMINAR, RECURSO_ABERTO, CONTEMPLADA,
 *   SUPLENTE, NAO_CONTEMPLADA.
 *
 * Avaliadores/habilitadores atribuídos via EditalMembro.
 * Avaliações já finalizadas no edital em RESULTADO_PRELIMINAR.
 * Recursos abertos aguardando decisão.
 * Tickets de atendimento abertos.
 * Projetos apoiados publicados no edital ENCERRADO.
 *
 * Senha padrão de todas as contas: Teste@123
 */

import {
  PrismaClient,
  Prisma,
  UserRole,
  TipoProponente,
  InscricaoStatus,
  EditalStatus,
  FuncaoEdital,
  AtendimentoStatus,
} from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()
const DEFAULT_PASSWORD = 'Teste@123'

// ─────────────────────────────────────────────────────────────────────────────
// 1. BOLSISTAS TESTADORES (Fase 1 — Cidades Inteligentes IFBA)
// ─────────────────────────────────────────────────────────────────────────────

type SeedUser = {
  slot: string
  nome: string
  email: string
  role: UserRole
  cpfCnpj: string
  tipoProponente?: TipoProponente
  telefone?: string
  cidade?: string
  uf?: string
}

const bolsistas: SeedUser[] = [
  // ADMIN (2)
  { slot: 'alef', nome: 'Alef Almeida', email: 'alef.almeida@pnab-uat.test', role: UserRole.ADMIN, cpfCnpj: '90000000001', telefone: '(74) 98100-0001', cidade: 'Irecê', uf: 'BA' },
  { slot: 'gabriel', nome: 'Gabriel Barauna', email: 'gabriel.barauna@pnab-uat.test', role: UserRole.ADMIN, cpfCnpj: '90000000002', telefone: '(74) 98100-0002', cidade: 'Irecê', uf: 'BA' },

  // HABILITADOR (3)
  { slot: 'giovane', nome: 'Giovane Neves', email: 'giovane.neves@pnab-uat.test', role: UserRole.HABILITADOR, cpfCnpj: '90000000003', telefone: '(74) 98100-0003', cidade: 'Irecê', uf: 'BA' },
  { slot: 'iago', nome: 'Iago William', email: 'iago.william@pnab-uat.test', role: UserRole.HABILITADOR, cpfCnpj: '90000000004', telefone: '(74) 98100-0004', cidade: 'Irecê', uf: 'BA' },
  { slot: 'joseh', nome: 'José Henrique', email: 'jose.henrique@pnab-uat.test', role: UserRole.HABILITADOR, cpfCnpj: '90000000005', telefone: '(74) 98100-0005', cidade: 'Irecê', uf: 'BA' },

  // AVALIADOR (4)
  { slot: 'larissa', nome: 'Larissa Miranda', email: 'larissa.miranda@pnab-uat.test', role: UserRole.AVALIADOR, cpfCnpj: '90000000006', telefone: '(74) 98100-0006', cidade: 'Irecê', uf: 'BA' },
  { slot: 'mariana', nome: 'Mariana Franca', email: 'mariana.franca@pnab-uat.test', role: UserRole.AVALIADOR, cpfCnpj: '90000000007', telefone: '(74) 98100-0007', cidade: 'Irecê', uf: 'BA' },
  { slot: 'gislaine', nome: 'Gislaine Santos', email: 'gislaine.santos@pnab-uat.test', role: UserRole.AVALIADOR, cpfCnpj: '90000000008', telefone: '(74) 98100-0008', cidade: 'Irecê', uf: 'BA' },
  { slot: 'rafael', nome: 'Rafael Muniz', email: 'rafael.muniz@pnab-uat.test', role: UserRole.AVALIADOR, cpfCnpj: '90000000009', telefone: '(74) 98100-0009', cidade: 'Irecê', uf: 'BA' },

  // ATENDIMENTO (2)
  { slot: 'caioa', nome: 'Caio Alves', email: 'caio.alves@pnab-uat.test', role: UserRole.ATENDIMENTO, cpfCnpj: '90000000010', telefone: '(74) 98100-0010', cidade: 'Irecê', uf: 'BA' },
  { slot: 'jorge', nome: 'Jorge Roberto', email: 'jorge.roberto@pnab-uat.test', role: UserRole.ATENDIMENTO, cpfCnpj: '90000000011', telefone: '(74) 98100-0011', cidade: 'Irecê', uf: 'BA' },

  // PROPONENTE pré-cadastrados (5 — Caio Nunes, Cauã, Eduardo P., Atus, Jeovani)
  { slot: 'cnunes', nome: 'Caio Nunes', email: 'caio.nunes@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '90000000012', tipoProponente: TipoProponente.PF, telefone: '(74) 98100-0012', cidade: 'Irecê', uf: 'BA' },
  { slot: 'caua', nome: 'Cauã Gomes', email: 'caua.gomes@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '90000000013', tipoProponente: TipoProponente.PF, telefone: '(74) 98100-0013', cidade: 'Irecê', uf: 'BA' },
  { slot: 'epereira', nome: 'Eduardo Pereira (MEI)', email: 'eduardo.pereira@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '12300000000100', tipoProponente: TipoProponente.MEI, telefone: '(74) 98100-0014', cidade: 'Irecê', uf: 'BA' },
  { slot: 'atus', nome: 'Atus Batista (PJ)', email: 'atus.batista@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '12300000000200', tipoProponente: TipoProponente.PJ, telefone: '(74) 98100-0015', cidade: 'Irecê', uf: 'BA' },
  { slot: 'jeovani', nome: 'Jeovani Nunes (Coletivo)', email: 'jeovani.nunes@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '12300000000300', tipoProponente: TipoProponente.COLETIVO, telefone: '(74) 98100-0016', cidade: 'Irecê', uf: 'BA' },

  // PROPONENTE auto-cadastro — NÃO criados aqui (João Alves, Juan Teles, Felipe Gomes)
  // Eles testam o fluxo de cadastro na planilha de testes (tarefas específicas).
]

// ─────────────────────────────────────────────────────────────────────────────
// 2. PLACEHOLDERS (Fase 2 — Secretaria / extras)
// ─────────────────────────────────────────────────────────────────────────────

const placeholders: SeedUser[] = [
  { slot: 'user01', nome: 'user01 (renomear para Secretaria)', email: 'user01@pnab-uat.test', role: UserRole.ADMIN, cpfCnpj: '99990000001' },
  { slot: 'user02', nome: 'user02 (renomear)', email: 'user02@pnab-uat.test', role: UserRole.HABILITADOR, cpfCnpj: '99990000002' },
  { slot: 'user03', nome: 'user03 (renomear)', email: 'user03@pnab-uat.test', role: UserRole.HABILITADOR, cpfCnpj: '99990000003' },
  { slot: 'user04', nome: 'user04 (renomear)', email: 'user04@pnab-uat.test', role: UserRole.AVALIADOR, cpfCnpj: '99990000004' },
  { slot: 'user05', nome: 'user05 (renomear)', email: 'user05@pnab-uat.test', role: UserRole.AVALIADOR, cpfCnpj: '99990000005' },
  { slot: 'user06', nome: 'user06 (renomear)', email: 'user06@pnab-uat.test', role: UserRole.AVALIADOR, cpfCnpj: '99990000006' },
  { slot: 'user07', nome: 'user07 (renomear)', email: 'user07@pnab-uat.test', role: UserRole.ATENDIMENTO, cpfCnpj: '99990000007' },
  { slot: 'user08', nome: 'user08 (renomear)', email: 'user08@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '99990000008', tipoProponente: TipoProponente.PF },
  { slot: 'user09', nome: 'user09 (renomear)', email: 'user09@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '99990000009', tipoProponente: TipoProponente.PF },
  { slot: 'user10', nome: 'user10 (renomear)', email: 'user10@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '99990000010', tipoProponente: TipoProponente.MEI },
  { slot: 'user11', nome: 'user11 (renomear)', email: 'user11@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '99990000011', tipoProponente: TipoProponente.COLETIVO },
]

// ─────────────────────────────────────────────────────────────────────────────
// 3. PROPONENTES FANTASMA — nomes fictícios pra dar volume às filas
// ─────────────────────────────────────────────────────────────────────────────

const fantasmas: SeedUser[] = [
  { slot: 'f01', nome: 'Maria Silva Costa', email: 'maria.silva@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000001', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f02', nome: 'João Batista Souza', email: 'joao.batista@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000002', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f03', nome: 'Ana Luiza Oliveira', email: 'ana.luiza@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000003', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f04', nome: 'Pedro Henrique Almeida', email: 'pedro.almeida@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000004', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f05', nome: 'Fernanda Rocha', email: 'fernanda.rocha@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000005', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f06', nome: 'Ricardo Mendes (MEI)', email: 'ricardo.mendes@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '23000000000001', tipoProponente: TipoProponente.MEI, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f07', nome: 'Lucas Barbosa', email: 'lucas.barbosa@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000007', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f08', nome: 'Camila Santos', email: 'camila.santos@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000008', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f09', nome: 'Rafael Gomes (MEI)', email: 'rafael.gomes.mei@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '23000000000002', tipoProponente: TipoProponente.MEI, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f10', nome: 'Beatriz Lima', email: 'beatriz.lima@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '70000000010', tipoProponente: TipoProponente.PF, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f11', nome: 'Associação Cultural Boa Nova', email: 'assoc.boanova@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '23000000000100', tipoProponente: TipoProponente.PJ, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f12', nome: 'Coletivo Cores do Sertão', email: 'coletivo.cores@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '23000000000200', tipoProponente: TipoProponente.COLETIVO, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f13', nome: 'Instituto Cultural Irecê', email: 'inst.cultural@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '23000000000300', tipoProponente: TipoProponente.PJ, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f14', nome: 'Coletivo Terra Viva', email: 'coletivo.terraviva@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '23000000000400', tipoProponente: TipoProponente.COLETIVO, cidade: 'Irecê', uf: 'BA' },
  { slot: 'f15', nome: 'Cia. Arte & Movimento', email: 'cia.artemovimento@pnab-uat.test', role: UserRole.PROPONENTE, cpfCnpj: '23000000000500', tipoProponente: TipoProponente.PJ, cidade: 'Irecê', uf: 'BA' },
]

// ─────────────────────────────────────────────────────────────────────────────
// 4. EDITAIS DE TESTE — cobrem todas as fases do ciclo de vida
// ─────────────────────────────────────────────────────────────────────────────

type SeedEdital = {
  slug: string
  titulo: string
  ano: number
  status: EditalStatus
  resumo: string
  valorTotal: number
  categorias: string[]
  tiposProponentePermitidos?: TipoProponente[]
  vagasContemplados?: number
  vagasSuplentes?: number
  notaMinima?: number
}

const CRONO_PADRAO = (baseStatus: EditalStatus): Prisma.InputJsonValue => {
  // Cronograma inteligente conforme fase: marcos passados vs futuros
  // só pra ficar realista nas telas públicas
  const hoje = new Date()
  const d = (offsetDias: number) => {
    const data = new Date(hoje)
    data.setDate(data.getDate() + offsetDias)
    return data.toISOString()
  }
  const marcos = [
    { label: 'Publicação do edital', dataHora: d(-60), destaque: false },
    { label: 'Início das inscrições', dataHora: d(-45), destaque: true },
    { label: 'Encerramento das inscrições', dataHora: d(-15), destaque: true },
    { label: 'Fase de habilitação', dataHora: d(-10), destaque: false },
    { label: 'Resultado preliminar', dataHora: d(15), destaque: false },
    { label: 'Prazo de recursos', dataHora: d(25), destaque: false },
    { label: 'Resultado final', dataHora: d(40), destaque: true },
  ]

  // Pra editais em INSCRICOES_ABERTAS, puxa datas pra frente
  if (baseStatus === EditalStatus.INSCRICOES_ABERTAS || baseStatus === EditalStatus.PUBLICADO) {
    return [
      { label: 'Publicação', dataHora: d(-15), destaque: false },
      { label: 'Início das inscrições', dataHora: d(-7), destaque: true },
      { label: 'Encerramento', dataHora: d(30), destaque: true },
      { label: 'Habilitação', dataHora: d(40), destaque: false },
      { label: 'Resultado preliminar', dataHora: d(60), destaque: false },
      { label: 'Recursos', dataHora: d(70), destaque: false },
      { label: 'Resultado final', dataHora: d(85), destaque: true },
    ]
  }

  return marcos
}

const CAMPOS_FORM_PADRAO: Prisma.InputJsonValue = [
  { nome: 'nomeProjeto', label: 'Nome do projeto', tipo: 'text', obrigatorio: true },
  { nome: 'descricao', label: 'Descrição do projeto', tipo: 'textarea', obrigatorio: true },
  { nome: 'valorSolicitado', label: 'Valor solicitado (R$)', tipo: 'number', obrigatorio: true },
  { nome: 'publicoAlvo', label: 'Público-alvo', tipo: 'text', obrigatorio: false },
  { nome: 'localExecucao', label: 'Local de execução', tipo: 'text', obrigatorio: true },
]

const CRITERIOS_PADRAO: Prisma.InputJsonValue = [
  { criterio: 'Mérito artístico', peso: 3, notaMax: 10, descricao: 'Relevância artística e cultural do projeto' },
  { criterio: 'Viabilidade', peso: 2, notaMax: 10, descricao: 'Clareza do plano de trabalho e coerência orçamentária' },
  { criterio: 'Impacto social', peso: 2, notaMax: 10, descricao: 'Alcance e benefício para a comunidade' },
  { criterio: 'Ações afirmativas', peso: 1, notaMax: 10, descricao: 'Inclusão de grupos sub-representados' },
]

const TIPOS_ANEXO_PADRAO: Prisma.InputJsonValue = [
  { tipo: 'DOCUMENTO_PESSOAL', label: 'Documento pessoal (RG ou CNH)', obrigatorio: true },
  { tipo: 'COMPROVANTE_ENDERECO', label: 'Comprovante de endereço', obrigatorio: true },
  { tipo: 'PROJETO', label: 'Projeto detalhado (PDF)', obrigatorio: true },
  { tipo: 'PORTFOLIO', label: 'Portfólio / currículo', obrigatorio: false },
  { tipo: 'OUTRO', label: 'Outros documentos', obrigatorio: false },
]

const editaisSeed: SeedEdital[] = [
  // RASCUNHO (admin em preparação)
  { slug: 'uat-pnab-2026-artes-integradas', titulo: 'PNAB 2026 — Artes Integradas (RASCUNHO)', ano: 2026, status: EditalStatus.RASCUNHO, resumo: 'Edital em preparação pela Secretaria de Cultura para fomento a projetos de artes integradas.', valorTotal: 400000, categorias: ['Artes Integradas', 'Performance'], vagasContemplados: 8, vagasSuplentes: 4, notaMinima: 6 },
  { slug: 'uat-pnab-2026-pontos-cultura', titulo: 'PNAB 2026 — Pontos de Cultura (RASCUNHO)', ano: 2026, status: EditalStatus.RASCUNHO, resumo: 'Seleção de espaços culturais independentes — em elaboração.', valorTotal: 240000, categorias: ['Pontos de Cultura', 'Espaços Culturais'], vagasContemplados: 12, vagasSuplentes: 6, notaMinima: 7 },

  // PUBLICADO (já foi publicado mas as inscrições ainda não abriram)
  { slug: 'uat-pnab-2026-patrimonio', titulo: 'PNAB 2026 — Patrimônio Cultural', ano: 2026, status: EditalStatus.PUBLICADO, resumo: 'Chamada pública para projetos de patrimônio material e imaterial.', valorTotal: 150000, categorias: ['Patrimônio Material', 'Patrimônio Imaterial', 'Memória'], vagasContemplados: 5, vagasSuplentes: 3, notaMinima: 7 },

  // INSCRICOES_ABERTAS (proponentes podem se inscrever)
  { slug: 'uat-pnab-2025-musica-danca', titulo: 'PNAB 2025 — Música e Dança', ano: 2025, status: EditalStatus.INSCRICOES_ABERTAS, resumo: 'Edital ativo para projetos de música e dança com inscrições abertas.', valorTotal: 180000, categorias: ['Música', 'Dança'], vagasContemplados: 6, vagasSuplentes: 3, notaMinima: 6, tiposProponentePermitidos: [TipoProponente.PF, TipoProponente.MEI, TipoProponente.COLETIVO] },
  { slug: 'uat-pnab-2025-cultura-digital', titulo: 'PNAB 2025 — Cultura Digital', ano: 2025, status: EditalStatus.INSCRICOES_ABERTAS, resumo: 'Projetos de cultura digital, web-arte e tecnologia criativa.', valorTotal: 120000, categorias: ['Cultura Digital', 'Web-Arte'], vagasContemplados: 4, vagasSuplentes: 2, notaMinima: 7 },

  // INSCRICOES_ENCERRADAS (fechou, aguarda habilitação)
  { slug: 'uat-pnab-2025-teatro-comunitario', titulo: 'PNAB 2025 — Teatro Comunitário', ano: 2025, status: EditalStatus.INSCRICOES_ENCERRADAS, resumo: 'Inscrições encerradas, aguardando início da habilitação.', valorTotal: 80000, categorias: ['Teatro', 'Cultura Popular'], vagasContemplados: 4, vagasSuplentes: 2, notaMinima: 6 },

  // HABILITACAO (habilitadores trabalham aqui)
  { slug: 'uat-pnab-2025-formacao', titulo: 'PNAB 2025 — Formação Cultural', ano: 2025, status: EditalStatus.HABILITACAO, resumo: 'Em fase de habilitação documental — 15 inscrições aguardando análise.', valorTotal: 100000, categorias: ['Formação', 'Oficinas', 'Capacitação'], vagasContemplados: 6, vagasSuplentes: 3, notaMinima: 6 },

  // AVALIACAO (avaliadores trabalham aqui)
  { slug: 'uat-pnab-2025-cultura-viva', titulo: 'PNAB 2025 — Cultura Viva', ano: 2025, status: EditalStatus.AVALIACAO, resumo: 'Em fase de avaliação técnica — inscrições habilitadas distribuídas entre avaliadores.', valorTotal: 220000, categorias: ['Cultura Popular', 'Tradição'], vagasContemplados: 8, vagasSuplentes: 4, notaMinima: 7 },

  // RESULTADO_PRELIMINAR (admins publicaram, proponentes podem ver classificação)
  { slug: 'uat-pnab-2025-literatura', titulo: 'PNAB 2025 — Literatura', ano: 2025, status: EditalStatus.RESULTADO_PRELIMINAR, resumo: 'Resultado preliminar publicado — prazo de recursos aberto.', valorTotal: 90000, categorias: ['Literatura'], vagasContemplados: 4, vagasSuplentes: 2, notaMinima: 7 },

  // RECURSO (fase de recursos ativa)
  { slug: 'uat-pnab-2025-artesanato', titulo: 'PNAB 2025 — Artesanato', ano: 2025, status: EditalStatus.RECURSO, resumo: 'Em análise de recursos pós-resultado preliminar.', valorTotal: 75000, categorias: ['Artesanato', 'Cultura Popular'], vagasContemplados: 5, vagasSuplentes: 2, notaMinima: 6 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function genInscricaoNumero(slugEdital: string, seq: number): string {
  const prefix = slugEdital
    .replace('uat-pnab-', '')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 8)
    .toUpperCase()
  return `UAT-${prefix}-${String(seq).padStart(3, '0')}`
}

function camposExemplo(nomeProjeto: string, categoria: string, valor: number): Prisma.InputJsonValue {
  return {
    nomeProjeto,
    descricao: `${nomeProjeto} — projeto cultural na categoria ${categoria}, com foco em democratização do acesso à cultura em Irecê e região. Inclui oficinas, apresentações e formação de público.`,
    valorSolicitado: valor,
    publicoAlvo: 'Comunidade ireceense em geral, com foco em jovens e famílias de bairros periféricos',
    localExecucao: 'Centro Cultural de Irecê e comunidades do território de identidade',
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  Seed UAT — Pré-produção PNAB Irecê')
  console.log('══════════════════════════════════════════════════════════════\n')

  const passwordHash = await hash(DEFAULT_PASSWORD, 12)

  // ── 1. Usuários ─────────────────────────────────────────────────────────
  const allUsers = [...bolsistas, ...placeholders, ...fantasmas]
  for (const u of allUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        nome: u.nome,
        role: u.role,
        cpfCnpj: u.cpfCnpj,
        tipoProponente: u.tipoProponente ?? null,
        telefone: u.telefone ?? null,
        cidade: u.cidade ?? null,
        uf: u.uf ?? null,
      },
      create: {
        email: u.email,
        password: passwordHash,
        nome: u.nome,
        role: u.role,
        cpfCnpj: u.cpfCnpj,
        tipoProponente: u.tipoProponente ?? null,
        telefone: u.telefone ?? null,
        cidade: u.cidade ?? null,
        uf: u.uf ?? null,
      },
    })
  }
  console.log(`✔ ${allUsers.length} usuários criados/atualizados (${bolsistas.length} bolsistas + ${placeholders.length} placeholders + ${fantasmas.length} fantasmas)`)

  // Mapa email → id pra uso posterior
  const userByEmail = new Map<string, { id: string; nome: string; tipoProponente: TipoProponente | null }>()
  const usersRecord = await prisma.user.findMany({
    where: { email: { in: allUsers.map((u) => u.email) } },
    select: { id: true, email: true, nome: true, tipoProponente: true },
  })
  usersRecord.forEach((u) => userByEmail.set(u.email, { id: u.id, nome: u.nome, tipoProponente: u.tipoProponente }))

  // ── 2. Editais ──────────────────────────────────────────────────────────
  const editalBySlug = new Map<string, { id: string; status: EditalStatus }>()

  for (const e of editaisSeed) {
    const edital = await prisma.edital.upsert({
      where: { slug: e.slug },
      update: {
        titulo: e.titulo,
        status: e.status,
        resumo: e.resumo,
        valorTotal: e.valorTotal,
        categorias: e.categorias,
        tiposProponentePermitidos: e.tiposProponentePermitidos?.map((t) => t.toString()) ?? [],
        vagasContemplados: e.vagasContemplados,
        vagasSuplentes: e.vagasSuplentes,
        notaMinima: e.notaMinima,
        cronograma: CRONO_PADRAO(e.status),
        camposFormulario: CAMPOS_FORM_PADRAO,
        criteriosAvaliacao: CRITERIOS_PADRAO,
        tiposAnexo: TIPOS_ANEXO_PADRAO,
        publishedAt: e.status === EditalStatus.RASCUNHO ? null : new Date(),
      },
      create: {
        slug: e.slug,
        titulo: e.titulo,
        ano: e.ano,
        status: e.status,
        resumo: e.resumo,
        valorTotal: e.valorTotal,
        categorias: e.categorias,
        tiposProponentePermitidos: e.tiposProponentePermitidos?.map((t) => t.toString()) ?? [],
        vagasContemplados: e.vagasContemplados,
        vagasSuplentes: e.vagasSuplentes,
        notaMinima: e.notaMinima,
        cronograma: CRONO_PADRAO(e.status),
        camposFormulario: CAMPOS_FORM_PADRAO,
        criteriosAvaliacao: CRITERIOS_PADRAO,
        tiposAnexo: TIPOS_ANEXO_PADRAO,
        regrasElegibilidade: 'Residência comprovada em Irecê/BA há pelo menos 1 ano. Idade mínima de 18 anos para pessoa física. Sem pendências com a Secretaria de Cultura.',
        acoesAfirmativas: 'Cotas de 30% para proponentes negros, indígenas e quilombolas.',
        publishedAt: e.status === EditalStatus.RASCUNHO ? null : new Date(),
      },
    })
    editalBySlug.set(e.slug, { id: edital.id, status: edital.status })
  }
  console.log(`✔ ${editaisSeed.length} editais criados/atualizados em diferentes fases`)

  // ── 3. EditalMembro — atribuir avaliadores e habilitadores ──────────────
  const membros: Array<{ slugEdital: string; emailUser: string; funcao: FuncaoEdital }> = [
    // HABILITACAO → habilitadores bolsistas
    { slugEdital: 'uat-pnab-2025-formacao', emailUser: 'giovane.neves@pnab-uat.test', funcao: FuncaoEdital.HABILITADOR },
    { slugEdital: 'uat-pnab-2025-formacao', emailUser: 'iago.william@pnab-uat.test', funcao: FuncaoEdital.HABILITADOR },
    { slugEdital: 'uat-pnab-2025-formacao', emailUser: 'jose.henrique@pnab-uat.test', funcao: FuncaoEdital.HABILITADOR },
    { slugEdital: 'uat-pnab-2025-teatro-comunitario', emailUser: 'giovane.neves@pnab-uat.test', funcao: FuncaoEdital.HABILITADOR },
    { slugEdital: 'uat-pnab-2025-teatro-comunitario', emailUser: 'iago.william@pnab-uat.test', funcao: FuncaoEdital.HABILITADOR },

    // AVALIACAO → avaliadores bolsistas
    { slugEdital: 'uat-pnab-2025-cultura-viva', emailUser: 'larissa.miranda@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },
    { slugEdital: 'uat-pnab-2025-cultura-viva', emailUser: 'mariana.franca@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },
    { slugEdital: 'uat-pnab-2025-cultura-viva', emailUser: 'gislaine.santos@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },
    { slugEdital: 'uat-pnab-2025-cultura-viva', emailUser: 'rafael.muniz@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },

    // RESULTADO_PRELIMINAR e RECURSO — avaliadores já trabalharam
    { slugEdital: 'uat-pnab-2025-literatura', emailUser: 'larissa.miranda@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },
    { slugEdital: 'uat-pnab-2025-literatura', emailUser: 'rafael.muniz@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },
    { slugEdital: 'uat-pnab-2025-artesanato', emailUser: 'larissa.miranda@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },
    { slugEdital: 'uat-pnab-2025-artesanato', emailUser: 'mariana.franca@pnab-uat.test', funcao: FuncaoEdital.AVALIADOR },
  ]

  for (const m of membros) {
    const edital = editalBySlug.get(m.slugEdital)
    const user = userByEmail.get(m.emailUser)
    if (!edital || !user) continue
    await prisma.editalMembro.upsert({
      where: { editalId_userId_funcao: { editalId: edital.id, userId: user.id, funcao: m.funcao } },
      update: {},
      create: { editalId: edital.id, userId: user.id, funcao: m.funcao },
    })
  }
  console.log(`✔ ${membros.length} atribuições de equipe (EditalMembro) criadas`)

  // ── 4. Inscrições densas em cada fase ──────────────────────────────────
  let totalInscricoes = 0
  let seq = 1

  // Proponentes fantasma + bolsistas disponíveis pra criar inscrições
  const proponentesDisponiveis = [...bolsistas, ...fantasmas]
    .filter((u) => u.role === UserRole.PROPONENTE)
    .map((u) => userByEmail.get(u.email)!)

  // ── 4.1 Em INSCRICOES_ABERTAS: misto de ENVIADA + RASCUNHO ──────────────
  for (const slug of ['uat-pnab-2025-musica-danca', 'uat-pnab-2025-cultura-digital']) {
    const edital = editalBySlug.get(slug)
    if (!edital) continue
    const editalRow = editaisSeed.find((x) => x.slug === slug)!
    for (let i = 0; i < 6; i++) {
      const prop = proponentesDisponiveis[i % proponentesDisponiveis.length]
      const isDraft = i < 2
      const numero = genInscricaoNumero(slug, seq++)
      if (await prisma.inscricao.findUnique({ where: { numero } })) continue
      const categoria = editalRow.categorias[i % editalRow.categorias.length]
      await prisma.inscricao.create({
        data: {
          numero,
          editalId: edital.id,
          proponenteId: prop.id,
          status: isDraft ? InscricaoStatus.RASCUNHO : InscricaoStatus.ENVIADA,
          categoria,
          campos: camposExemplo(`Projeto ${prop.nome} — ${categoria}`, categoria, 10000 + i * 3000),
          submittedAt: isDraft ? null : new Date(),
        },
      })
      totalInscricoes++
    }
  }

  // ── 4.2 Em HABILITACAO: 12 inscrições ENVIADAS aguardando análise ───────
  {
    const slug = 'uat-pnab-2025-formacao'
    const edital = editalBySlug.get(slug)!
    const editalRow = editaisSeed.find((x) => x.slug === slug)!
    for (let i = 0; i < 12; i++) {
      const prop = proponentesDisponiveis[i % proponentesDisponiveis.length]
      const numero = genInscricaoNumero(slug, seq++)
      if (await prisma.inscricao.findUnique({ where: { numero } })) continue
      const categoria = editalRow.categorias[i % editalRow.categorias.length]
      await prisma.inscricao.create({
        data: {
          numero,
          editalId: edital.id,
          proponenteId: prop.id,
          status: InscricaoStatus.ENVIADA,
          categoria,
          campos: camposExemplo(`Formação ${prop.nome}`, categoria, 8000 + i * 2000),
          submittedAt: new Date(Date.now() - (i + 1) * 86400000),
        },
      })
      totalInscricoes++
    }
  }

  // ── 4.3 Em AVALIACAO: 15 HABILITADAS + 5 INABILITADAS (pra ver motivos) ─
  const avaliadoresCulturaViva = ['larissa.miranda@pnab-uat.test', 'mariana.franca@pnab-uat.test', 'gislaine.santos@pnab-uat.test', 'rafael.muniz@pnab-uat.test']
  const inscricoesCulturaVivaIds: string[] = []
  {
    const slug = 'uat-pnab-2025-cultura-viva'
    const edital = editalBySlug.get(slug)!
    const editalRow = editaisSeed.find((x) => x.slug === slug)!

    // 15 HABILITADAS
    for (let i = 0; i < 15; i++) {
      const prop = proponentesDisponiveis[i % proponentesDisponiveis.length]
      const numero = genInscricaoNumero(slug, seq++)
      if (await prisma.inscricao.findUnique({ where: { numero } })) continue
      const categoria = editalRow.categorias[i % editalRow.categorias.length]
      const insc = await prisma.inscricao.create({
        data: {
          numero,
          editalId: edital.id,
          proponenteId: prop.id,
          status: InscricaoStatus.HABILITADA,
          categoria,
          campos: camposExemplo(`Cultura Viva ${prop.nome}`, categoria, 12000 + i * 2500),
          submittedAt: new Date(Date.now() - (i + 15) * 86400000),
        },
      })
      inscricoesCulturaVivaIds.push(insc.id)
      totalInscricoes++
    }

    // 5 INABILITADAS (com motivo — pro proponente testar recurso)
    for (let i = 0; i < 5; i++) {
      const prop = proponentesDisponiveis[(i + 15) % proponentesDisponiveis.length]
      const numero = genInscricaoNumero(slug, seq++)
      if (await prisma.inscricao.findUnique({ where: { numero } })) continue
      const categoria = editalRow.categorias[i % editalRow.categorias.length]
      await prisma.inscricao.create({
        data: {
          numero,
          editalId: edital.id,
          proponenteId: prop.id,
          status: InscricaoStatus.INABILITADA,
          categoria,
          campos: camposExemplo(`Inabilitada ${prop.nome}`, categoria, 9000),
          submittedAt: new Date(Date.now() - (i + 20) * 86400000),
          motivoInabilitacao: [
            'Documento de identidade ilegível',
            'Comprovante de residência vencido',
            'Projeto fora da categoria permitida',
            'Orçamento incompatível com o edital',
            'Falta de declaração obrigatória',
          ][i],
        },
      })
      totalInscricoes++
    }

    // Cria algumas avaliações em andamento (EM_AVALIACAO) — avaliadores começaram mas não finalizaram
    for (let i = 0; i < 5; i++) {
      const inscId = inscricoesCulturaVivaIds[i]
      const avaliadorEmail = avaliadoresCulturaViva[i % avaliadoresCulturaViva.length]
      const avaliador = userByEmail.get(avaliadorEmail)!
      await prisma.avaliacao.upsert({
        where: { inscricaoId_avaliadorId: { inscricaoId: inscId, avaliadorId: avaliador.id } },
        update: {},
        create: {
          inscricaoId: inscId,
          avaliadorId: avaliador.id,
          notas: [
            { criterio: 'Mérito artístico', nota: 8.0, peso: 3 },
            { criterio: 'Viabilidade', nota: 7.5, peso: 2 },
          ] as Prisma.InputJsonValue,
          notaTotal: 7.7,
          finalizada: false,
        },
      })
      await prisma.inscricao.update({
        where: { id: inscId },
        data: { status: InscricaoStatus.EM_AVALIACAO },
      })
    }
  }

  // ── 4.4 RESULTADO_PRELIMINAR: 10 inscrições classificadas ──────────────
  {
    const slug = 'uat-pnab-2025-literatura'
    const edital = editalBySlug.get(slug)!
    const editalRow = editaisSeed.find((x) => x.slug === slug)!
    const statusDistrib: Array<{ status: InscricaoStatus; nota: number }> = [
      { status: InscricaoStatus.CONTEMPLADA, nota: 9.5 },
      { status: InscricaoStatus.CONTEMPLADA, nota: 9.1 },
      { status: InscricaoStatus.CONTEMPLADA, nota: 8.8 },
      { status: InscricaoStatus.CONTEMPLADA, nota: 8.5 },
      { status: InscricaoStatus.SUPLENTE, nota: 8.2 },
      { status: InscricaoStatus.SUPLENTE, nota: 7.9 },
      { status: InscricaoStatus.NAO_CONTEMPLADA, nota: 7.5 },
      { status: InscricaoStatus.NAO_CONTEMPLADA, nota: 7.1 },
      { status: InscricaoStatus.NAO_CONTEMPLADA, nota: 6.8 },
      { status: InscricaoStatus.NAO_CONTEMPLADA, nota: 5.5 },
    ]
    for (let i = 0; i < statusDistrib.length; i++) {
      const prop = proponentesDisponiveis[i % proponentesDisponiveis.length]
      const numero = genInscricaoNumero(slug, seq++)
      if (await prisma.inscricao.findUnique({ where: { numero } })) continue
      const categoria = editalRow.categorias[0]
      const { status, nota } = statusDistrib[i]
      const insc = await prisma.inscricao.create({
        data: {
          numero,
          editalId: edital.id,
          proponenteId: prop.id,
          status,
          categoria,
          campos: camposExemplo(`Literatura ${prop.nome}`, categoria, 15000),
          submittedAt: new Date(Date.now() - 45 * 86400000),
          notaFinal: nota,
          posicao: i + 1,
        },
      })
      totalInscricoes++

      // Cria 2 avaliações finalizadas por inscrição
      for (const avEmail of ['larissa.miranda@pnab-uat.test', 'rafael.muniz@pnab-uat.test']) {
        const av = userByEmail.get(avEmail)!
        const notaAv = nota + (Math.random() - 0.5) * 0.4
        await prisma.avaliacao.upsert({
          where: { inscricaoId_avaliadorId: { inscricaoId: insc.id, avaliadorId: av.id } },
          update: {},
          create: {
            inscricaoId: insc.id,
            avaliadorId: av.id,
            notas: [
              { criterio: 'Mérito artístico', nota: Math.min(10, notaAv + 0.3), peso: 3 },
              { criterio: 'Viabilidade', nota: notaAv, peso: 2 },
              { criterio: 'Impacto social', nota: Math.max(0, notaAv - 0.2), peso: 2 },
              { criterio: 'Ações afirmativas', nota: notaAv, peso: 1 },
            ] as Prisma.InputJsonValue,
            parecer: `Avaliação referente ao projeto ${insc.numero}. Proposta consistente, com pontos fortes no mérito artístico e algumas observações pontuais sobre viabilidade orçamentária.`,
            notaTotal: Number(notaAv.toFixed(2)),
            finalizada: true,
          },
        })
      }
    }
  }

  // ── 4.5 RECURSO: 8 inscrições classificadas + 3 recursos abertos ────────
  {
    const slug = 'uat-pnab-2025-artesanato'
    const edital = editalBySlug.get(slug)!
    const editalRow = editaisSeed.find((x) => x.slug === slug)!
    const statusDistrib: Array<{ status: InscricaoStatus; nota: number; comRecurso: boolean }> = [
      { status: InscricaoStatus.CONTEMPLADA, nota: 9.2, comRecurso: false },
      { status: InscricaoStatus.CONTEMPLADA, nota: 8.9, comRecurso: false },
      { status: InscricaoStatus.CONTEMPLADA, nota: 8.4, comRecurso: false },
      { status: InscricaoStatus.SUPLENTE, nota: 8.0, comRecurso: true },
      { status: InscricaoStatus.SUPLENTE, nota: 7.8, comRecurso: false },
      { status: InscricaoStatus.RECURSO_ABERTO, nota: 7.2, comRecurso: true },
      { status: InscricaoStatus.RECURSO_ABERTO, nota: 6.8, comRecurso: true },
      { status: InscricaoStatus.NAO_CONTEMPLADA, nota: 5.9, comRecurso: false },
    ]
    for (let i = 0; i < statusDistrib.length; i++) {
      const prop = proponentesDisponiveis[i % proponentesDisponiveis.length]
      const numero = genInscricaoNumero(slug, seq++)
      if (await prisma.inscricao.findUnique({ where: { numero } })) continue
      const categoria = editalRow.categorias[i % editalRow.categorias.length]
      const d = statusDistrib[i]
      const insc = await prisma.inscricao.create({
        data: {
          numero,
          editalId: edital.id,
          proponenteId: prop.id,
          status: d.status,
          categoria,
          campos: camposExemplo(`Artesanato ${prop.nome}`, categoria, 11000),
          submittedAt: new Date(Date.now() - 60 * 86400000),
          notaFinal: d.nota,
          posicao: i + 1,
        },
      })
      totalInscricoes++

      if (d.comRecurso) {
        await prisma.recurso.create({
          data: {
            inscricaoId: insc.id,
            fase: 'RESULTADO_PRELIMINAR',
            texto: `Solicito revisão da classificação de "${insc.numero}". Acredito que meu projeto atende plenamente aos critérios de avaliação, em especial ao mérito artístico e impacto social, e peço reconsideração da pontuação atribuída.`,
            urlAnexos: [],
          },
        })
      }
    }
  }

  console.log(`✔ ${totalInscricoes} inscrições criadas em múltiplos status`)

  // ── 5. Atendimentos / Tickets ──────────────────────────────────────────
  const tickets = [
    { protocolo: 'UAT-ATD-2026-0001', nomeContato: 'Maria da Conceição', emailContato: 'maria.conceicao@exemplo.com', assunto: 'Dúvida sobre documentação do edital PNAB 2025', mensagem: 'Olá, estou tentando me inscrever no edital de Música e Dança e não sei se posso usar comprovante de residência no nome da minha mãe. Podem me ajudar?', status: AtendimentoStatus.ABERTO },
    { protocolo: 'UAT-ATD-2026-0002', nomeContato: 'José Pereira', emailContato: 'jose.p@exemplo.com', assunto: 'Erro ao fazer upload do projeto', mensagem: 'Tento enviar o PDF do projeto (tem 8MB) e o sistema fica processando mas não salva. Já tentei em 3 navegadores diferentes.', status: AtendimentoStatus.EM_ATENDIMENTO },
    { protocolo: 'UAT-ATD-2026-0003', nomeContato: 'Grupo Cultural Alecrim', emailContato: 'alecrim@exemplo.com', assunto: 'Podemos nos inscrever como coletivo sem CNPJ?', mensagem: 'Somos um coletivo de 8 pessoas sem CNPJ formalizado. Podemos concorrer no edital de Cultura Viva?', status: AtendimentoStatus.ABERTO },
    { protocolo: 'UAT-ATD-2026-0004', nomeContato: 'Ana Paula Rocha', emailContato: 'anapaula@exemplo.com', assunto: 'Não recebi o e-mail de confirmação', mensagem: 'Fiz minha inscrição ontem e ainda não recebi o e-mail de confirmação. Já olhei no spam.', status: AtendimentoStatus.ABERTO },
    { protocolo: 'UAT-ATD-2026-0005', nomeContato: 'Carlos Eduardo', emailContato: 'carlos.ed@exemplo.com', assunto: 'Quero retirar minha inscrição', mensagem: 'Preciso retirar minha inscrição do edital de Literatura por motivos pessoais. Como faço?', status: AtendimentoStatus.EM_ATENDIMENTO },
    { protocolo: 'UAT-ATD-2026-0006', nomeContato: 'Rosa Lima', emailContato: 'rosa.lima@exemplo.com', assunto: 'Prazo de recurso', mensagem: 'Até quando posso apresentar recurso contra o resultado preliminar do edital de Literatura?', status: AtendimentoStatus.ABERTO },
  ]

  for (const t of tickets) {
    const existing = await prisma.atendimento.findUnique({ where: { protocolo: t.protocolo } })
    if (existing) continue
    await prisma.atendimento.create({
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
  console.log(`✔ ${tickets.length} tickets de atendimento criados`)

  // ── 6. Projetos apoiados (transparência pública) ───────────────────────
  // Reaproveita ProjetoApoiado criado no seed principal se existir

  // ── Resumo final ────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════')
  console.log('  Resumo do ambiente pré-produção')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Senha de todas as contas: ${DEFAULT_PASSWORD}`)
  console.log('')
  console.log('  Editais por fase (para que cada role tenha trabalho):')
  console.log(`    RASCUNHO              → 2 editais (admin pode publicar)`)
  console.log(`    PUBLICADO             → 1 edital (admin pode abrir inscrições)`)
  console.log(`    INSCRICOES_ABERTAS    → 2 editais (proponentes se inscrevem)`)
  console.log(`    INSCRICOES_ENCERRADAS → 1 edital (admin inicia habilitação)`)
  console.log(`    HABILITACAO           → 1 edital, 12 inscrições ENVIADAS (habilitadores trabalham)`)
  console.log(`    AVALIACAO             → 1 edital, 15 HABILITADAS + 5 INABILITADAS + 5 EM_AVALIACAO (avaliadores e habilitadores trabalham)`)
  console.log(`    RESULTADO_PRELIMINAR  → 1 edital, 10 classificadas com avaliações finalizadas`)
  console.log(`    RECURSO               → 1 edital, 8 classificadas + 3 recursos abertos (admin decide)`)
  console.log('')
  console.log('  Tickets de atendimento: 6 (4 ABERTO + 2 EM_ATENDIMENTO)')
  console.log(`  Inscrições totais criadas: ${totalInscricoes}`)
  console.log('')
  console.log('══════════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed UAT:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
