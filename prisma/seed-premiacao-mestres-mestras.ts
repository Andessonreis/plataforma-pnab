/**
 * Seed de Produção — Edital de Chamamento Público Nº 02/2026
 * Premiação para Mestres e Mestras de Irecê (Política Nacional de Cultura Viva)
 *
 * Fonte: novo_edital_100%/EDITAL MESTRES 28.07.docx + anexos 01 a 04
 * USO: npx tsx prisma/seed-premiacao-mestres-mestras.ts
 *
 * Flags:
 *   --clean    Remove um edital existente com o mesmo slug antes de criar
 *
 * Anexos (PDF do edital + 4 anexos): o script tenta enviar pro bucket
 * Supabase 'editais' se a env EDITAL_MESTRES_PDF_DIR apontar pra uma pasta
 * com os arquivos abaixo. Se a pasta não existir (ex.: teste local sem os
 * PDFs), essa etapa é pulada com um aviso — o edital ainda é criado/atualizado
 * normalmente.
 */

import { PrismaClient, type Prisma } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import type { CategoriaConfig } from '../src/types/categoria-config'

const prisma = new PrismaClient()

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue
}

// ─── Categoria única, vagas, cotas e valor ───────────────────────────────────
// 5 premiações de R$ 10.000,00. Cotas (item 6.1): 1 vaga pessoas negras,
// 1 vaga pessoas indígenas e/ou com deficiência (coluna combinada, mesmo
// padrão usado no seed do Festival Centenário pra "indigena_pcd").

const categoriasConfig: CategoriaConfig[] = [
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

// ─── Campos do formulário (etapa "Dados") ────────────────────────────────────

const camposFormulario = [
  { nome: 'nome_completo', label: 'Nome completo do Mestre ou Mestra', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
  { nome: 'data_nascimento', label: 'Data de nascimento', tipo: 'data', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Requisito de participação: idade igual ou superior a 60 anos (item 3.1 do edital).' },
  { nome: 'telefone_contato', label: 'Telefone/WhatsApp de contato', tipo: 'texto', obrigatorio: true, placeholder: '(74) 90000-0000', opcoes: [], hint: '' },
  { nome: 'email_contato', label: 'E-mail de contato', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
  { nome: 'tempo_atuacao_irece', label: 'Tempo de atuação cultural em Irecê (anos)', tipo: 'numero', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Requisito mínimo: 10 anos de atuação (item 3.1 do edital).' },
]

// ─── Etapa customizada — Trajetória Cultural ─────────────────────────────────
// A descrição da trajetória (campo "descricao_trajetoria") é a parte que a
// etapa opcional de vídeo substitui (item 5.2.c do edital — "inscrição via
// oralidade"). A Carta de Reconhecimento (Anexo 01) e o material de
// comprovação continuam como upload obrigatório de anexo — vídeo não os
// substitui, só a narrativa escrita.

const etapasCustomizadas = [
  {
    id: 'trajetoria-cultural',
    titulo: 'Trajetória Cultural',
    descricao: 'Conte a trajetória cultural do Mestre ou Mestra em Irecê — pode ser por texto ou, se preferir, usando a etapa de vídeo mais adiante.',
    ordem: 0,
    campos: [
      { nome: 'comunidade_referencia', label: 'Comunidade(s) ou tradição cultural de referência', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      { nome: 'descricao_trajetoria', label: 'Descrição da trajetória cultural', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Notório conhecimento, trajetória contínua em Irecê e transmissão de saberes/fazeres — pode ser substituída pela etapa de vídeo.', maxLength: 2000 },
      { nome: 'reconhecimento_publico', label: 'Reconhecimento público da trajetória', tipo: 'textarea', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Reconhecimento por instituições públicas, organizações da sociedade civil ou pela comunidade.', maxLength: 1200 },
      { nome: 'banco_nome', label: 'Nome do banco', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: 'Dados bancários para pagamento da premiação (Anexo 04).' },
      { nome: 'banco_numero', label: 'Número do banco', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      { nome: 'agencia_numero', label: 'Número da agência', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      { nome: 'conta_tipo', label: 'Tipo de conta', tipo: 'multiselect', obrigatorio: true, placeholder: '', hint: 'Selecione uma opção.', opcoes: ['Conta Corrente', 'Conta Poupança'] },
      { nome: 'conta_numero', label: 'Número da conta', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
      { nome: 'praca_pagamento', label: 'Praça de pagamento', tipo: 'texto', obrigatorio: true, placeholder: '', opcoes: [], hint: '' },
    ],
  },
]

// ─── Critérios de avaliação (item 9.3) ───────────────────────────────────────
// 3 critérios, 0-10 cada, peso 1 (peso igual, conforme o edital). Sem fórmula
// customizada — a média ponderada padrão do sistema já produz o resultado
// correto na escala 0-10 usada em todo o admin/avaliador.

const criteriosAvaliacao = [
  { criterio: 'A) Singularidade da Trajetória Artística', descricao: 'Consistência e singularidade da atuação da Mestra ou Mestre; excelência no desenvolvimento de sua atividade junto à comunidade.', notaMax: 10, peso: 1, modo: 'slider' as const },
  { criterio: 'B) Impacto da Trajetória na Coletividade e na Cidade de Irecê', descricao: 'Contribuição para o desenvolvimento, transmissão, difusão ou preservação de saberes e fazeres culturais; influência na formação de redes, grupos ou coletivos culturais.', notaMax: 10, peso: 1, modo: 'slider' as const },
  { criterio: 'C) Reconhecimento Público da Contribuição da Trajetória', descricao: 'Reconhecimento da trajetória por instituições públicas, organizações da sociedade civil e comunidade; relevância e longevidade da atuação cultural no território.', notaMax: 10, peso: 1, modo: 'slider' as const },
]

// Sem fórmula customizada = média ponderada padrão (0-10). O edital fala em
// "nota máxima 30, desclassifica abaixo de 10" (soma bruta dos 3 critérios) —
// convertido pra escala 0-10 do sistema: 10/30 ≈ 3,33.
const formulaAvaliacao = null
const notaMinima = 3.33

const desempate = [
  { descricao: 'Maior pontuação no critério Singularidade da Trajetória Artística', tipo: 'criterio' as const, ref: 'A) Singularidade da Trajetória Artística', direcao: 'desc' as const },
  { descricao: 'Maior pontuação no critério Impacto da Trajetória na Coletividade e na Cidade de Irecê', tipo: 'criterio' as const, ref: 'B) Impacto da Trajetória na Coletividade e na Cidade de Irecê', direcao: 'desc' as const },
  // Maior idade entre os candidatos empatados — critério final de desempate
  // não automatizável (sem suporte no sistema), decidido manualmente pela comissão.
]

// ─── Tipos de anexo (itens 3.1.1, 5.2 e 6.1) ─────────────────────────────────
// Reaproveita chaves já cadastradas pelo Festival Centenário onde o
// documento é equivalente (AUTODECL_ETNICO_RACIAL, AUTODECL_PCD).

const tiposAnexo = [
  { tipo: 'CARTA_RECONHECIMENTO', label: 'Carta de Reconhecimento ou Declaração de Trajetória (Anexo 01)', obrigatorio: true },
  { tipo: 'COMPROVACAO_TRAJETORIA', label: 'Material de Comprovação da Trajetória Cultural (fotos, matérias, prêmios etc.)', obrigatorio: true },
  { tipo: 'AUTODECL_ETNICO_RACIAL', label: 'Autodeclaração Étnico-Racial (Anexo 02)', obrigatorio: false },
  { tipo: 'AUTODECL_PCD', label: 'Autodeclaração para Pessoa com Deficiência (Anexo 03)', obrigatorio: false },
]

// ─── Cronograma (conforme a tabela do edital) ────────────────────────────────

const cronograma = [
  { tipo: 'custom' as const, label: 'Publicação do Edital', dataHora: '2026-07-28T00:00:00' },
  { tipo: 'fase' as const, fase: 'INSCRICOES_ABERTAS' as const, dataHora: '2026-07-31T00:00:00' },
  { tipo: 'fase' as const, fase: 'INSCRICOES_ENCERRADAS' as const, dataHora: '2026-08-28T23:59:00' },
  { tipo: 'fase' as const, fase: 'HABILITACAO' as const, dataHora: '2026-08-29T00:00:00' },
  { tipo: 'custom' as const, label: 'Publicação das Inscrições Habilitadas (preliminar)', dataHora: '2026-08-31T00:00:00', acao: 'PUBLICACAO_HABILITADOS' as const },
  { tipo: 'custom' as const, label: 'Período para recursos — habilitação', dataHora: '2026-09-01T00:00:00', fimEm: '2026-09-03T23:59:00', acao: 'RECURSO_HABILITACAO_JANELA' as const },
  { tipo: 'custom' as const, label: 'Publicação das Inscrições Habilitadas (após recurso)', dataHora: '2026-09-04T00:00:00', acao: 'PUBLICACAO_HABILITADOS_POS_RECURSOS' as const },
  { tipo: 'fase' as const, fase: 'AVALIACAO' as const, dataHora: '2026-09-08T00:00:00' },
  { tipo: 'fase' as const, fase: 'RESULTADO_PRELIMINAR' as const, dataHora: '2026-09-15T00:00:00' },
  { tipo: 'custom' as const, label: 'Período para recursos — seleção', dataHora: '2026-09-16T00:00:00', fimEm: '2026-09-18T23:59:00', acao: 'RECURSO_RESULTADO_JANELA' as const },
  { tipo: 'fase' as const, fase: 'RESULTADO_FINAL' as const, dataHora: '2026-09-21T00:00:00' },
  { tipo: 'custom' as const, label: 'Assinatura do Termo de Premiação Cultural', dataHora: '2026-09-22T00:00:00', fimEm: '2026-09-24T23:59:00' },
  { tipo: 'custom' as const, label: 'Convocação de Suplentes (se houver)', dataHora: '2026-09-28T00:00:00' },
  { tipo: 'custom' as const, label: 'Assinatura do Termo pelos Suplentes', dataHora: '2026-09-29T00:00:00', fimEm: '2026-09-30T23:59:00' },
  { tipo: 'fase' as const, fase: 'ENCERRADO' as const, dataHora: '2026-09-30T23:59:00' },
]

// ─── Regras de elegibilidade e ações afirmativas ─────────────────────────────

const regrasElegibilidade = [
  '• Pessoa física, com idade igual ou superior a 60 anos',
  '• Atuação no campo artístico-cultural há, no mínimo, 10 anos em Irecê, com trajetória contínua e reconhecida pela comunidade',
  '• Deve anexar Carta de reconhecimento ou declaração emitida por organização cultural, Ponto de Cultura, associação, grupo, instituição de ensino, entidade da sociedade civil ou liderança comunitária (Anexo 01)',
  '• Vedado: pessoas jurídicas de qualquer natureza',
  '• Vedado: quem participou da elaboração do edital, da análise de candidatura ou do julgamento de recursos',
  '• Vedado: agente político, dirigente governamental, servidor público vinculado ao órgão responsável pela seleção, membro do Legislativo/Judiciário/Ministério Público/Tribunal de Contas, ou respectivo cônjuge/companheiro/parente até 2º grau',
  '• Uma mesma pessoa não pode se inscrever mais de uma vez, nem ser contemplada em outro edital do Cultura Viva ao mesmo tempo',
  '• Em caso de mais de uma inscrição do mesmo proponente, vale apenas a última cadastrada',
].join('\n')

const acoesAfirmativas = [
  '• Cotas garantidas: 1 vaga para pessoas negras (pretas e pardas) e 1 vaga para pessoas indígenas e/ou com deficiência, dentro das 5 vagas totais',
  '• Concorrência concomitante: cotistas concorrem simultaneamente às vagas de ampla concorrência',
  '• Remanejamento: vaga de cota não preenchida por falta de optantes volta para a ampla concorrência; se não houver inscritos aptos numa categoria de cota, a vaga é redirecionada primeiro para a outra categoria de cotas, depois para a ampla concorrência',
  '• Mínimo de 30% das premiações destinadas a agentes culturais com trajetória comprovadamente ligada às culturas tradicionais e populares (art. 6º da Portaria MinC nº 206/2025) — pode ser composto junto às vagas de cota',
].join('\n')

// ─── Arquivos do edital (PDF oficial + anexos) ───────────────────────────────

const ARQUIVOS = [
  { filename: 'edital-mestres-mestras.pdf', titulo: 'Edital Completo — Premiação para Mestres e Mestras de Irecê', tipo: 'PDF_EDITAL' },
  { filename: 'anexo-01-declaracao-parceria.pdf', titulo: 'Anexo 01 — Declaração de Parceria', tipo: 'MODELO_EDITAL' },
  { filename: 'anexo-02-autodeclaracao-etnico-racial.pdf', titulo: 'Anexo 02 — Modelo de Autodeclaração Étnico-Racial', tipo: 'MODELO_EDITAL' },
  { filename: 'anexo-03-autodeclaracao-pcd.pdf', titulo: 'Anexo 03 — Modelo de Autodeclaração para Pessoa com Deficiência', tipo: 'MODELO_EDITAL' },
  { filename: 'anexo-04-termo-premiacao-cultural.pdf', titulo: 'Anexo 04 — Termo de Premiação Cultural (modelo, assinado após a seleção)', tipo: 'MODELO_EDITAL' },
]

async function uploadArquivos(editalId: string) {
  const pdfDir = process.env.EDITAL_MESTRES_PDF_DIR
  if (!pdfDir || !fs.existsSync(pdfDir)) {
    console.log(`Aviso: EDITAL_MESTRES_PDF_DIR não definido ou pasta inexistente (${pdfDir ?? '—'}). Pulando upload dos anexos.\n`)
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('Aviso: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes. Pulando upload dos anexos.\n')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('Enviando arquivos do edital pro Supabase Storage...')
  const existentes = await prisma.arquivoEdital.findMany({ where: { editalId }, select: { titulo: true } })
  const titulosExistentes = new Set(existentes.map((a) => a.titulo))

  for (const arq of ARQUIVOS) {
    if (titulosExistentes.has(arq.titulo)) {
      console.log(`  Já existe: ${arq.titulo} — pulando.`)
      continue
    }

    const filePath = path.join(pdfDir, arq.filename)
    if (!fs.existsSync(filePath)) {
      console.log(`  Aviso: arquivo não encontrado (${filePath}) — pulando ${arq.titulo}.`)
      continue
    }

    const buffer = fs.readFileSync(filePath)
    const fileId = randomUUID().split('-')[0]
    const storagePath = `edital-${editalId}/${fileId}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('editais')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })
    if (uploadError) {
      console.error(`  Erro ao enviar ${arq.titulo}: ${uploadError.message}`)
      continue
    }

    const { data: publicUrlData } = supabase.storage.from('editais').getPublicUrl(storagePath)

    await prisma.arquivoEdital.create({
      data: { editalId, tipo: arq.tipo, titulo: arq.titulo, url: publicUrlData.publicUrl },
    })
    console.log(`  Enviado: ${arq.titulo}`)
  }
  console.log('')
}

// ═══════════════════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const shouldClean = process.argv.includes('--clean')
  const slug = 'premiacao-mestres-mestras-irece-2026'

  console.log('=== Seed — Premiação para Mestres e Mestras de Irecê ===\n')

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

  console.log('Cadastrando categoria cultural no catálogo...')
  for (const [i, nome] of categorias.entries()) {
    const catSlug = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    await prisma.category.upsert({
      where: { nome },
      update: { slug: catSlug, ativa: true, ordem: i },
      create: { nome, slug: catSlug, ativa: true, ordem: i, isSystem: false },
    })
  }
  console.log(`  ${categorias.length} categoria cadastrada.\n`)

  console.log('Cadastrando tipos de anexo no banco...')
  for (const tipo of tiposAnexo) {
    await prisma.attachmentType.upsert({
      where: { tipo: tipo.tipo },
      update: { label: tipo.label, obrigatorio: tipo.obrigatorio, tag: 'Mestres e Mestras' },
      create: { tipo: tipo.tipo, label: tipo.label, obrigatorio: tipo.obrigatorio, tag: 'Mestres e Mestras', isSystem: false },
    })
  }
  console.log(`  ${tiposAnexo.length} tipos de anexo cadastrados.\n`)

  const stillExisting = await prisma.edital.findUnique({ where: { slug } })
  let editalId: string

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
        tiposProponentePermitidos: ['PF'],
        vagasContemplados: null,
        vagasSuplentes: null,
        videoHabilitado: true,
      },
    })
    editalId = stillExisting.id
    console.log('  Edital atualizado com sucesso.\n')
  } else {
    console.log('Criando edital...')
    const edital = await prisma.edital.create({
      data: {
        titulo: 'Premiação para Mestres e Mestras de Irecê',
        slug,
        ano: 2026,
        status: 'RASCUNHO',
        resumo: 'Edital de Chamamento Público Nº 02/2026 (Política Nacional de Cultura Viva) para premiação de 5 Mestres ou Mestras das Culturas Tradicionais e Populares de Irecê, reconhecidos pelo notório saber e pela trajetória de transmissão de conhecimentos culturais. Valor total: R$ 50.000,00 — R$ 10.000,00 por premiado(a), sem contrapartida ou prestação de contas (doação sem encargo).',
        valorTotal: 50000,
        categorias,
        categoriasConfig: toJson(categoriasConfig),
        regrasElegibilidade,
        acoesAfirmativas,
        tiposProponentePermitidos: ['PF'],
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
    editalId = edital.id
    console.log(`  Edital criado com sucesso! (id: ${edital.id}, slug: ${edital.slug})\n`)
  }

  await uploadArquivos(editalId)

  console.log('Resumo:')
  console.log(`  Vagas: 5 (3 ampla concorrência + 1 cota negros + 1 cota indígena/PCD)`)
  console.log(`  Valor: R$ 50.000,00 (R$ 10.000,00 por premiado)`)
  console.log(`  Critérios de avaliação: ${criteriosAvaliacao.length} (peso igual, sem fórmula customizada)`)
  console.log(`  Nota mínima: ${notaMinima} (≡ 10/30 do edital, convertido pra escala 0-10)`)
  console.log(`  Tipos de anexo: ${tiposAnexo.length}`)
  console.log(`  Tipos de proponente permitidos: PF (pessoa física)`)
  console.log(`  Vídeo habilitado: sim (substitui só a narrativa de trajetória, não os anexos obrigatórios)`)
  console.log(`  Status: RASCUNHO (alterar no painel admin quando pronto pra publicar)\n`)

  console.log('⚠️  Decisões de interpretação tomadas ao estruturar este edital (revisar antes de publicar):')
  console.log('  1. O edital fala em nota máxima 30 (soma bruta de 3 critérios) e corte de 10 pontos.')
  console.log('     O sistema usa escala 0-10 (média dos critérios) pra manter consistência com o resto do')
  console.log('     admin/avaliador — nota mínima convertida pra 3.33 (10/30). Sem fórmula customizada.')
  console.log('  2. Anexo 04 (Termo de Premiação Cultural) foi tratado como documento de referência/modelo,')
  console.log('     não como upload obrigatório de inscrição — é assinado só depois da seleção do contemplado.')
  console.log('  3. A etapa de vídeo (item 5.2.c — "inscrição via oralidade") substitui apenas o campo de')
  console.log('     descrição da trajetória (etapa customizada); a Carta de Reconhecimento (Anexo 01) e o')
  console.log('     material de comprovação continuam obrigatórios como anexo, com ou sem vídeo.')
  console.log('  4. tiposProponentePermitidos = [PF] — o edital veda pessoas jurídicas de qualquer natureza')
  console.log('     (item 4.3) e não menciona MEI/coletivo como alternativa.\n')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
