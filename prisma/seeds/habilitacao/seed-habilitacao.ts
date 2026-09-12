import { PrismaClient, UserRole, type Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'
import { proponentesHabilitacaoData } from './proponentes.data'
import { inscricoesPendentesData } from './inscricoes-pendentes.data'
import { inscricoesConcluidasData } from './inscricoes-concluidas.data'
import {
  categoriasConfigFormacao,
  categoriasFormacao,
  tiposAnexoFormacao,
  camposFormularioFormacao,
  etapasCustomizadasFormacao,
  cronogramaFormacao,
} from './edital-formacao.data'

const DEFAULT_PASSWORD = 'Teste@123'
const EDITAL_SLUG = 'pnab-2025-formacao-cultural'

function toJson(v: unknown): Prisma.InputJsonValue {
  return v as unknown as Prisma.InputJsonValue
}

export async function seedHabilitacao(prisma: PrismaClient) {
  const passwordHash = await hash(DEFAULT_PASSWORD, 12)
  console.log('=== Semeando ambiente realista de Habilitação Documental ===\n')

  const habilitador = await prisma.user.upsert({
    where: { email: 'habilitador@pnab.irece.ba.gov.br' },
    update: { role: UserRole.HABILITADOR, ativo: true },
    create: { email: 'habilitador@pnab.irece.ba.gov.br', password: passwordHash, role: UserRole.HABILITADOR, nome: 'Habilitador João Silva', cpfCnpj: '00000000003', ativo: true },
  })

  const usersMap = new Map<string, string>()
  for (const p of proponentesHabilitacaoData) {
    const u = await prisma.user.upsert({
      where: { email: p.email },
      update: { nome: p.nome, cpfCnpj: p.cpfCnpj, tipoProponente: p.tipoProponente, telefone: p.telefone, cep: p.cep, logradouro: p.logradouro, numero: p.numero, bairro: p.bairro, cidade: p.cidade, uf: p.uf, ativo: true },
      create: { email: p.email, password: passwordHash, role: UserRole.PROPONENTE, nome: p.nome, cpfCnpj: p.cpfCnpj, tipoProponente: p.tipoProponente, telefone: p.telefone, cep: p.cep, logradouro: p.logradouro, numero: p.numero, bairro: p.bairro, cidade: p.cidade, uf: p.uf, ativo: true },
    })
    usersMap.set(p.email, u.id)
  }
  console.log(`✔ ${proponentesHabilitacaoData.length} proponentes realistas de Irecê cadastrados/atualizados.`)

  const edital = await prisma.edital.upsert({
    where: { slug: EDITAL_SLUG },
    update: {
      status: 'HABILITACAO',
      categorias: categoriasFormacao,
      categoriasConfig: toJson(categoriasConfigFormacao),
      tiposAnexo: toJson(tiposAnexoFormacao),
      camposFormulario: toJson(camposFormularioFormacao),
      etapasCustomizadas: toJson(etapasCustomizadasFormacao),
      cronograma: toJson(cronogramaFormacao),
    },
    create: {
      slug: EDITAL_SLUG,
      titulo: 'Edital de Formação Cultural 2025 — Oficinas e Workshops',
      ano: 2025,
      status: 'HABILITACAO',
      resumo: 'Seleção pública de propostas formativas em artes cênicas, música, artes visuais e audiovisual para a comunidade de Irecê/BA.',
      valorTotal: 80000,
      categorias: categoriasFormacao,
      categoriasConfig: toJson(categoriasConfigFormacao),
      tiposAnexo: toJson(tiposAnexoFormacao),
      camposFormulario: toJson(camposFormularioFormacao),
      etapasCustomizadas: toJson(etapasCustomizadasFormacao),
      cronograma: toJson(cronogramaFormacao),
    },
  })

  // Vincula membros habilitadores nos editais com habilitação
  const editaisComHabilitador = await prisma.edital.findMany({
    where: { slug: { in: [EDITAL_SLUG, 'festival-arte-cultura-irece-centenario-2026', 'premiacao-mestres-mestras-irece-2026', 'pnab-2025-fomento-artes'] } },
    select: { id: true, slug: true },
  })
  for (const ed of editaisComHabilitador) {
    await prisma.editalMembro.upsert({
      where: { editalId_userId_funcao: { editalId: ed.id, userId: habilitador.id, funcao: 'HABILITADOR' } },
      update: {},
      create: { editalId: ed.id, userId: habilitador.id, funcao: 'HABILITADOR' },
    })
  }
  console.log(`✔ Habilitador vinculado a ${editaisComHabilitador.length} edital(is).`)

  for (const t of tiposAnexoFormacao) {
    await prisma.attachmentType.upsert({
      where: { tipo: t.tipo },
      update: { label: t.label, obrigatorio: t.obrigatorio },
      create: { tipo: t.tipo, label: t.label, obrigatorio: t.obrigatorio, tag: 'PNAB', isSystem: true },
    })
  }

  // Limpa inscrições existentes do edital para re-seeding idempotente
  const inscricoesAntigas = await prisma.inscricao.findMany({ where: { editalId: edital.id }, select: { id: true } })
  const idsAntigos = inscricoesAntigas.map((i) => i.id)
  if (idsAntigos.length > 0) {
    await prisma.recurso.deleteMany({ where: { inscricaoId: { in: idsAntigos } } })
    await prisma.avaliacao.deleteMany({ where: { inscricaoId: { in: idsAntigos } } })
    await prisma.anexoInscricao.deleteMany({ where: { inscricaoId: { in: idsAntigos } } })
    await prisma.projetoApoiado.deleteMany({ where: { inscricaoId: { in: idsAntigos } } })
    await prisma.inscricao.deleteMany({ where: { id: { in: idsAntigos } } })
  }

  // Inserção das propostas pendentes (aguardando conferência ao vivo)
  for (const p of inscricoesPendentesData) {
    const userId = usersMap.get(p.proponenteEmail)!
    const inscricao = await prisma.inscricao.create({
      data: {
        numero: p.numero,
        editalId: edital.id,
        proponenteId: userId,
        status: 'ENVIADA',
        categoria: p.categoria,
        cotasOptIn: p.cotasOptIn,
        campos: toJson(p.campos),
        orcamento: toJson(p.orcamento),
        submittedAt: new Date('2026-08-24T15:30:00Z'),
      },
    })
    for (const a of p.anexos) {
      await prisma.anexoInscricao.create({
        data: {
          inscricaoId: inscricao.id,
          tipo: a.tipo,
          titulo: a.titulo,
          url: a.url,
          valido: a.valido ?? null,
          observacao: a.observacao ?? null,
          adicionadoPorId: a.juntadoPelaSecretaria ? habilitador.id : null,
          origemNota: a.origemNota ?? null,
        },
      })
    }
  }

  // Inserção das propostas concluídas (habilitadas e inabilitadas com recursos)
  for (const c of inscricoesConcluidasData) {
    const userId = usersMap.get(c.proponenteEmail)!
    const inscricao = await prisma.inscricao.create({
      data: {
        numero: c.numero,
        editalId: edital.id,
        proponenteId: userId,
        status: c.status,
        categoria: c.categoria,
        cotasOptIn: c.cotasOptIn,
        motivoInabilitacao: c.motivoInabilitacao ?? null,
        resultadoLiberadoEm: c.status === 'HABILITADA' ? new Date('2026-09-08T10:00:00Z') : null,
        campos: toJson(c.campos),
        orcamento: toJson(c.orcamento),
        submittedAt: new Date('2026-08-23T11:20:00Z'),
      },
    })
    for (const a of c.anexos) {
      await prisma.anexoInscricao.create({
        data: {
          inscricaoId: inscricao.id,
          tipo: a.tipo,
          titulo: a.titulo,
          url: a.url,
          valido: a.valido ?? null,
          observacao: a.observacao ?? null,
        },
      })
    }
    if (c.recurso) {
      await prisma.recurso.create({
        data: {
          inscricaoId: inscricao.id,
          fase: c.recurso.fase,
          texto: c.recurso.texto,
          urlAnexos: [],
          decisao: c.recurso.decisao ?? null,
          justificativa: c.recurso.justificativa ?? null,
        },
      })
    }
  }

  console.log(`✔ ${inscricoesPendentesData.length} inscrições PENDENTES (prontas para aula/gravação).`)
  console.log(`✔ ${inscricoesConcluidasData.length} inscrições CONCLUÍDAS (habilitadas, inabilitadas e recurso).`)
  console.log('═════════════════════════════════════════════════════════')
  console.log('  Habilitação pronta para teste e demonstração:')
  console.log('  URL: http://localhost:3000/admin/habilitacao')
  console.log('  Usuário: habilitador@pnab.irece.ba.gov.br / Teste@123')
  console.log('═════════════════════════════════════════════════════════\n')
}
