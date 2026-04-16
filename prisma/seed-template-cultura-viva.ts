/**
 * Seed idempotente — Template de Avaliação "Cultura Viva"
 *
 * Cria (ou atualiza) o template de avaliação baseado no Anexo 01 do edital
 * Chamamento Público — Rede Municipal de Pontos de Cultura de Irecê/BA.
 *
 * Referência: docs/edtial/CONFIG-CULTURA-VIVA.md
 *
 * Como rodar:
 *   Local:  npx tsx prisma/seed-template-cultura-viva.ts
 *   Prod:   docker compose -f docker-compose.prod.yml exec app \
 *             npx tsx prisma/seed-template-cultura-viva.ts
 *
 * Seguro rodar múltiplas vezes — usa upsert pelo nome único do template.
 */
import { PrismaClient, Prisma, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

const TEMPLATE_NOME = 'Cultura Viva'
const TEMPLATE_DESCRICAO =
  'Critérios de avaliação do Chamamento Público — Rede Municipal de Pontos de Cultura de Irecê/BA (Anexo 01). Bloco 1: atuação da entidade. Bloco 2: projeto (efeitos, execução, abrangência). Bloco 3: bonificação.'
const TEMPLATE_FORMULA = '((B1+B2)/2)+B3'

interface CriterioSeed {
  bloco: string
  criterio: string
  descricao: string
  notaMax: number
  peso: number
}

const CRITERIOS: CriterioSeed[] = [
  // ── Bloco 1 — Atuação da entidade cultural (18 critérios, máx 100 pts) ────
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1a) Representa iniciativas culturais já desenvolvidas por comunidades, grupos e redes de colaboração', descricao: 'Verificar portfólio, formulário e materiais enviados, conforme Lei nº 13.018/2014, art. 6º, I', notaMax: 10, peso: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1b) Promove, amplia e garante a criação e a produção artística e cultural', descricao: '', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1c) Incentiva a preservação da cultura de Irecê', descricao: '', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1d) Estimula a exploração de espaços públicos e privados para ação cultural', descricao: '', notaMax: 2, peso: 2 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1e) Aumenta a visibilidade das diversas iniciativas culturais', descricao: '', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1f) Promove a diversidade cultural brasileira, garantindo diálogos interculturais', descricao: '', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1g) Garante acesso aos meios de fruição, produção e difusão cultural', descricao: '', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1h) Assegura a inclusão cultural de idosos, mulheres, jovens, pessoas negras, PCD, LGBTQIAP+ e/ou de baixa renda', descricao: 'Combate às desigualdades sociais', notaMax: 4, peso: 4 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1i) Contribui para o fortalecimento da autonomia social das comunidades', descricao: '', notaMax: 10, peso: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1j) Promove o intercâmbio entre diferentes segmentos da comunidade', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1k) Estimula a articulação das redes sociais e culturais e dessas com a educação', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1l) Adota princípios de gestão compartilhada entre atores culturais não governamentais e o Estado', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1m) Fomenta as economias solidária e criativa', descricao: '', notaMax: 4, peso: 4 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1n) Protege o patrimônio cultural material, imaterial e promove as memórias comunitárias', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1o) Apoia e incentiva manifestações culturais populares e tradicionais', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1p) Realiza atividades culturais gratuitas e abertas com regularidade na comunidade', descricao: '', notaMax: 10, peso: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1q) Ações relacionadas aos eixos estruturantes da PNCV (formação, produção, difusão sociocultural continuada)', descricao: '', notaMax: 10, peso: 10 },
  { bloco: 'Bloco 1 — Atuação da entidade cultural', criterio: '1r) Articulação com outras organizações (Frentes, Redes, Conselhos, Comissões)', descricao: 'Participação e incidência política em áreas sinérgicas à PNCV', notaMax: 10, peso: 10 },

  // ── Bloco 2-I — Efeitos artístico-culturais (12 critérios, máx 50 pts) ────
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-a) Contribui com a cidadania cultural e ampliação do acesso a bens e serviços culturais', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-b) Oficinas/ações formativas impactam com a ampliação de repertórios artísticos e culturais', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-c) Estratégias de acessibilidade promovem acesso e protagonismo de PCD', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-d) Estimula diversidade cultural e alteridade, promovendo protagonismo de grupos vulneráveis', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-e) Promove a expressividade e a criação estética', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-f) Prevê processos cooperativos e criativos continuados', descricao: 'Jogos, dinâmicas, experimentação, exercício estético, etc.', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-g) Contribui para uso protagonista das tecnologias digitais', descricao: 'Cultura digital, culturas populares em meios digitais, combate à desinformação', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-h) Ações contribuem com geração de trabalho e renda na comunidade', descricao: '', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-i) Fomenta crédito solidário, moedas sociais, equipamentos coletivos e comercialização solidária', descricao: 'Estúdios, ilhas de edição, feiras, lojas, portais, etc.', notaMax: 3, peso: 3 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-j) Impacta diferentes dimensões da vida social (educação, saúde, meio ambiente, segurança)', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-k) Estratégias efetivas de participação da comunidade na gestão do Ponto de Cultura', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-I — Efeitos artístico-culturais do projeto', criterio: '2I-l) Promove atuação em rede do Ponto de Cultura para fortalecer base comunitária', descricao: '', notaMax: 3, peso: 3 },

  // ── Bloco 2-II — Execução e Plano de Trabalho (8 critérios, máx 35 pts) ───
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-a) Capacidade técnica, gerencial e operacional da entidade', descricao: 'Vinculação do portfólio com o projeto apresentado', notaMax: 4, peso: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-b) Define metas razoáveis e exequíveis com ações e prazos', descricao: '', notaMax: 4, peso: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-c) Prevê estratégias pertinentes em relação aos resultados pretendidos', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-d) Estratégias de divulgação específicas com democratização da informação', descricao: '', notaMax: 4, peso: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-e) Estratégias e meios de verificação do cumprimento das metas', descricao: '', notaMax: 4, peso: 4 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-f) Equipe técnica adequada para realização do projeto', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-g) Clareza, coerência e razoabilidade entre ações e itens de despesa', descricao: '', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-II — Execução e Plano de Trabalho', criterio: '2II-h) Exequibilidade e viabilidade no prazo proposto', descricao: '', notaMax: 4, peso: 4 },

  // ── Bloco 2-III — Abrangência do público beneficiário (6 crit, máx 15) ───
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-a) Estudantes da Rede Pública de ensino', descricao: '', notaMax: 2, peso: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-b) Primeira Infância (crianças de 0 a 6 anos)', descricao: '', notaMax: 2, peso: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-c) População de baixa renda, áreas com precária oferta de serviços públicos e cultura', descricao: 'Incluindo área rural', notaMax: 5, peso: 5 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-d) Pessoas com deficiência e/ou mobilidade reduzida', descricao: '', notaMax: 2, peso: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-e) Povos Indígenas e Comunidades Tradicionais de Matriz Africana', descricao: '', notaMax: 2, peso: 2 },
  { bloco: 'Bloco 2-III — Abrangência do público beneficiário', criterio: '2III-f) Pessoas LGBTQIA+', descricao: '', notaMax: 2, peso: 2 },

  // ── Bloco 3 — Bonificação (1 critério, máx 5 pts) ─────────────────────────
  { bloco: 'Bloco 3 — Bonificação', criterio: 'Bonificação — Autodeclaração negro(a), indígena ou PCD', descricao: 'Agente Cultural (representante) da entidade que se autodeclare, conforme Anexos 05 e/ou 06', notaMax: 5, peso: 5 },
]

async function main() {
  // Sanity check — total esperado pelo edital: 205 pts (100 + 50 + 35 + 15 + 5)
  const totalNotaMax = CRITERIOS.reduce((sum, c) => sum + c.notaMax, 0)
  if (totalNotaMax !== 205) {
    throw new Error(
      `Soma dos critérios inconsistente: ${totalNotaMax} pts (esperado: 205). Revise o array CRITERIOS.`,
    )
  }
  if (CRITERIOS.length !== 45) {
    throw new Error(`Esperado 45 critérios, encontrado ${CRITERIOS.length}. Revise o array CRITERIOS.`)
  }

  console.log(`[seed:cultura-viva] ${CRITERIOS.length} critérios, ${totalNotaMax} pts totais`)

  // Busca um usuário ADMIN pra atribuir autoria da auditoria (opcional)
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  })
  if (admin) {
    console.log(`[seed:cultura-viva] Autoria atribuída ao admin: ${admin.email}`)
  } else {
    console.warn('[seed:cultura-viva] Nenhum admin encontrado — auditoria sem userId')
  }

  // Verifica se já existe — decide entre CRIADO/ATUALIZADO pra auditoria
  const existente = await prisma.evaluationTemplate.findUnique({
    where: { nome: TEMPLATE_NOME },
    select: { id: true },
  })

  // Próxima ordem (só usada na criação)
  const last = await prisma.evaluationTemplate.findFirst({
    orderBy: { ordem: 'desc' },
    select: { ordem: true },
  })
  const nextOrdem = (last?.ordem ?? 0) + 10

  // Prisma aceita Json como InputJsonValue — array de objetos literais precisa de cast
  const criteriosJson = CRITERIOS as unknown as Prisma.InputJsonValue

  const template = await prisma.evaluationTemplate.upsert({
    where: { nome: TEMPLATE_NOME },
    create: {
      nome: TEMPLATE_NOME,
      descricao: TEMPLATE_DESCRICAO,
      criterios: criteriosJson,
      formula: TEMPLATE_FORMULA,
      isSystem: false,
      ativo: true,
      ordem: nextOrdem,
    },
    update: {
      descricao: TEMPLATE_DESCRICAO,
      criterios: criteriosJson,
      formula: TEMPLATE_FORMULA,
      ativo: true,
    },
  })

  const action = existente ? 'TEMPLATE_AVALIACAO_ATUALIZADO' : 'TEMPLATE_AVALIACAO_CRIADO'

  await prisma.auditLog.create({
    data: {
      userId: admin?.id ?? null,
      action,
      entity: 'EvaluationTemplate',
      entityId: template.id,
      details: {
        nome: template.nome,
        criteriosCount: CRITERIOS.length,
        totalNotaMax,
        formula: TEMPLATE_FORMULA,
        origem: 'seed-template-cultura-viva',
      },
    },
  })

  console.log(
    `[seed:cultura-viva] ${existente ? 'Atualizado' : 'Criado'} — id=${template.id} nome="${template.nome}"`,
  )
}

main()
  .catch((err) => {
    console.error('[seed:cultura-viva] Erro:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
