import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { Abertura } from '@/components/home/abertura'
import { PassosInscricao } from '@/components/home/passos-inscricao'
import { SecaoConceito } from '@/components/home/secao-conceito'
import { SecaoServicos } from '@/components/home/secao-servicos'
import { SecaoDiaADia } from '@/components/home/secao-dia-a-dia'
import { SecaoNoticias } from '@/components/home/secao-noticias'
import { SecaoProjetosApoiados } from '@/components/home/secao-projetos-apoiados'
import { SecaoOndeEncontrar } from '@/components/home/secao-onde-encontrar'
import { FaixaNumeros } from '@/components/ui'
import { Varal } from '@/components/ui/varal'
import type {
  SlideDestaque,
  EditalResumo,
  MomentoResumo,
  ProjetoApoiadoResumo,
} from '@/components/home/types'
import type { BadgeVariant } from '@/components/ui/badge'
import type { EditalStatus } from '@prisma/client'
import { getStatusDisplay, OPEN_STATUSES } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getNextDeadline } from '@/lib/utils/cronograma'
import { noticiaParaListagem } from '@/app/(public)/noticias/consulta'
import { nomeDoProjeto } from '@/app/(public)/projetos-apoiados/consulta'
import { SITUACOES } from '@/app/(public)/projetos-apoiados/tipos'

export const metadata: Metadata = {
  title: 'Início',
  description:
    'Portal oficial da Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Cultura e Turismo de Irecê/BA.',
}

/**
 * Fotografias que correm atrás da peça de abertura, em ordem de exibição.
 *
 * Escolhidas por temperatura e por assunto — as quatro são noturnas e de luz
 * quente, então atravessam o banho de tinta terracota sem brigar com a paleta,
 * e alternam gente de perto com praça cheia para dar ritmo ao rodízio.
 *
 * Ficaram de fora, do que existe em `public/images`: o pórtico "Minha Feliz
 * Cidade" (o letreiro em neon disputaria com o texto do banner) e a
 * panorâmica da cidade (é urbanismo, não cultura, e a dominante azul do
 * entardecer destoa do resto da abertura).
 */
const FOTOS_ABERTURA = [
  '/images/galeria/foto-04.png', // fogueira cenográfica do São João de Irecê
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
]

/**
 * Peça institucional fixa da abertura. Textos são editoriais da Secretaria —
 * não derivam de consulta ao banco, para que a comunicação não mude sozinha
 * quando um edital é cadastrado ou encerrado.
 */
const SLIDE_INSTITUCIONAL: SlideDestaque = {
  tipo: 'composicao',
  id: 'pnab-editais',
  titulo: 'Editais da PNAB Irecê',
  subtitulo: 'Política Nacional Aldir Blanc de Fomento à Cultura',
  ctaLabel: 'Ver editais',
  ctaUrl: '/editais',
  banner: {
    chamadaInicio: 'Os editais da',
    chamadaDestaque: 'PNAB Irecê',
    chamadaFim: 'já estão publicados.',
    linguagensRotulo: 'Fomento para',
    linguagens: [
      'Música',
      'Teatro',
      'Dança',
      'Audiovisual',
      'Literatura',
      'Artes visuais',
      'Artesanato',
      'Culturas populares',
    ],
    valorPrefixo: 'Mais de',
    valorNumero: 400,
    valorUnidade: 'mil',
    valorSufixo: 'em recursos',
  },
}

// Editais em andamento p/ o painel de oportunidades da home — mais amplo que
// OPEN_STATUSES (que em /editais marca "aberto" só até inscrição): aqui um
// edital em habilitação ou avaliação ainda está rolando, só não recebe mais
// inscrição. Não reaproveita OPEN_STATUSES pra não mudar a aba "Abertos" de
// /editais nem o carimbo de arquivado dos cards.
const HOME_EDITAIS_STATUSES: EditalStatus[] = [...OPEN_STATUSES, 'HABILITACAO', 'AVALIACAO']

export default async function HomePage() {
  const agora = new Date()

  const [
    editaisAbertos,
    totalFomento,
    projetosCount,
    editaisDestaque,
    slidesAdmin,
    momentosAdmin,
    noticiasDestaque,
    projetosDestaque,
  ] = await Promise.all([
      prisma.edital.count({
        where: { status: { in: ['PUBLICADO', 'INSCRICOES_ABERTAS'] } },
      }),
      prisma.edital.aggregate({
        where: { status: { not: 'RASCUNHO' } },
        _sum: { valorTotal: true },
      }),
      prisma.projetoApoiado.count({ where: { publicado: true } }),
      prisma.edital.findMany({
        // Banner exibe editais em andamento (aberto, habilitação ou
        // avaliação) — encerrados não entram nem pra completar as 3 vagas.
        where: { status: { in: HOME_EDITAIS_STATUSES } },
        orderBy: { createdAt: 'desc' },
        // Busca além dos 3 exibidos para conseguir promover os que estão com
        // inscrições abertas antes de cortar a lista.
        take: 8,
        select: {
          id: true,
          titulo: true,
          slug: true,
          status: true,
          valorTotal: true,
          categorias: true,
          cronograma: true,
        },
      }),
      // #63 — Slides do admin: ativos e dentro da janela de exibição
      // (inicioEm/fimEm opcionais — null significa sem limite).
      prisma.slideDestaque.findMany({
        where: {
          ativo: true,
          AND: [
            { OR: [{ inicioEm: null }, { inicioEm: { lte: agora } }] },
            { OR: [{ fimEm: null }, { fimEm: { gte: agora } }] },
          ],
        },
        orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
        select: { id: true, titulo: true, descricao: true, imagemUrl: true, ctaLabel: true, ctaUrl: true },
      }),
      // Dia a dia da Secretaria: só os ativos, na ordem cadastrada no admin.
      prisma.momentoSecretaria.findMany({
        where: { ativo: true },
        orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
        select: { id: true, categoria: true, imagemUrl: true, instagramUrl: true },
      }),
      // Prévia do noticiário — mesmo critério de publicação de `/noticias`.
      prisma.noticia.findMany({
        where: { publicado: true, publicadoEm: { not: null } },
        orderBy: { publicadoEm: 'desc' },
        take: 3,
        select: {
          id: true,
          titulo: true,
          slug: true,
          corpo: true,
          tags: true,
          imagemUrl: true,
          publicadoEm: true,
        },
      }),
      // Prévia de transparência — mesmo critério de publicação de `/projetos-apoiados`.
      prisma.projetoApoiado.findMany({
        where: { publicado: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          inscricao: {
            select: {
              categoria: true,
              campos: true,
              proponente: { select: { nome: true } },
            },
          },
        },
      }),
    ])

  const slides: SlideDestaque[] = [
    SLIDE_INSTITUCIONAL,
    ...slidesAdmin
      .filter((slide) => Boolean(slide.imagemUrl))
      .map<SlideDestaque>((slide) => ({
        tipo: 'arte',
        id: `slide-${slide.id}`,
        titulo: slide.titulo,
        subtitulo: slide.descricao ?? undefined,
        imagemUrl: slide.imagemUrl as string,
        ctaLabel: slide.ctaLabel ?? 'Saiba mais',
        ctaUrl: slide.ctaUrl ?? '/editais',
      })),
  ]

  // O painel de abertura anuncia oportunidades, então editais recebendo
  // inscrição vêm antes dos apenas publicados.
  const prioridadeStatus = (status: string) =>
    status === 'INSCRICOES_ABERTAS' ? 0 : 1

  const editais: EditalResumo[] = [...editaisDestaque]
    .sort((a, b) => prioridadeStatus(a.status) - prioridadeStatus(b.status))
    .slice(0, 3)
    .map((edital) => {
      const status = getStatusDisplay(edital.status)
      const prazo = getNextDeadline(edital.cronograma)
      return {
        id: edital.id,
        titulo: edital.titulo,
        slug: edital.slug,
        categoria: edital.categorias[0] ?? 'Fomento à cultura',
        valor: formatCurrency(edital.valorTotal),
        statusLabel: status.label,
        statusVariant: status.badgeVariant as BadgeVariant,
        prazoLabel: prazo ? `${prazo.label}: ${formatDate(prazo.dataHora)}` : null,
      }
    })

  const momentos: MomentoResumo[] = momentosAdmin.map((momento) => ({
    id: momento.id,
    categoria: momento.categoria,
    imagemUrl: momento.imagemUrl,
    instagramUrl: momento.instagramUrl,
  }))

  const noticias = noticiasDestaque.map((noticia) => noticiaParaListagem(noticia, 140))

  const projetos: ProjetoApoiadoResumo[] = projetosDestaque.map((projeto) => {
    const situacao = SITUACOES[projeto.statusExecucao] ?? {
      label: projeto.statusExecucao,
      tom: 'arquivo' as const,
    }
    return {
      id: projeto.id,
      nome: nomeDoProjeto(projeto.inscricao.campos) ?? projeto.inscricao.proponente.nome,
      categoria: projeto.inscricao.categoria,
      valor: formatCurrency(projeto.valorAprovado),
      situacao,
    }
  })

  const somaFomento = totalFomento._sum.valorTotal ? Number(totalFomento._sum.valorTotal) : 0
  const numeros = [
    { valor: String(editaisAbertos || '—'), rotulo: 'Editais Abertos' },
    {
      valor:
        somaFomento > 0
          ? somaFomento.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : '—',
      rotulo: 'Valor em Fomento',
    },
    { valor: projetosCount > 0 ? String(projetosCount) : '—', rotulo: 'Projetos Apoiados' },
    { valor: '100%', rotulo: 'Online' },
  ]

  return (
    <div className="tema-secult font-questrial">
      <Abertura slides={slides} editais={editais} fotos={FOTOS_ABERTURA} />
      <FaixaNumeros numeros={numeros} />
      <PassosInscricao />

      <Varal />

      <SecaoConceito />
      <SecaoProjetosApoiados projetos={projetos} />
      <SecaoDiaADia momentos={momentos} />
      <SecaoNoticias noticias={noticias} />
      <SecaoOndeEncontrar />
      <SecaoServicos />
    </div>
  )
}
