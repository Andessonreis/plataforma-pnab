import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Badge, Button, Card } from '@/components/ui'
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  CountUp,
} from '@/components/ui/animated'
import {
  IconSearch,
  IconClipboard,
  IconFileText,
  IconCheck,
  IconCalendar,
  IconCurrency,
  IconArrowRight,
  IconEye,
  IconMail,
} from '@/components/ui/icons'
import { getStatusDisplay } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getNextDeadline } from '@/lib/utils/cronograma'
import { HeroCarousel, type SlideData } from '@/components/home/hero-carousel'

export const metadata: Metadata = {
  title: 'Início',
  description:
    'Portal oficial da Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Arte e Cultura de Irecê/BA.',
}

// ── Página ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const agora = new Date()

  // Buscar métricas reais, editais em destaque e slides admin ativos
  const [editaisAbertos, totalFomento, projetosCount, editaisDestaque, slidesAdmin] = await Promise.all([
    prisma.edital.count({
      where: { status: { in: ['PUBLICADO', 'INSCRICOES_ABERTAS'] } },
    }),
    prisma.edital.aggregate({
      where: { status: { not: 'RASCUNHO' } },
      _sum: { valorTotal: true },
    }),
    prisma.projetoApoiado.count({
      where: { publicado: true },
    }),
    prisma.edital.findMany({
      where: { status: { not: 'RASCUNHO' } },
      orderBy: { createdAt: 'desc' },
      take: 3,
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
    // #63 — Slides Destaque criados no admin: ativos e dentro da janela
    // de exibição (inicioEm/fimEm opcionais — null = sem limite).
    prisma.slideDestaque.findMany({
      where: {
        ativo: true,
        AND: [
          { OR: [{ inicioEm: null }, { inicioEm: { lte: agora } }] },
          { OR: [{ fimEm: null }, { fimEm: { gte: agora } }] },
        ],
      },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        titulo: true,
        descricao: true,
        imagemUrl: true,
        ctaLabel: true,
        ctaUrl: true,
      },
    }),
  ])

  // Lista de fotos reais para banners e slides (sem usar gradientes gerados por CSS)
  const realBannerImages = [
    '/images/banner/novo_banner/novo_editais.jpeg',
    '/images/banner/foto_site (3).png',
    '/images/banner/foto_site (4).png',
    '/images/banner/foto_site (5).png',
    '/images/banner/foto_site (6).png',
    '/images/banner/foto_site (2).png',
    '/images/hero-irece.jpg',
  ]

  // ── Montar slides do carrossel ──────────────────────────────────────────

  // Slide 1: Hero principal em destaque com o novo banner prioritário
  const heroSlides: SlideData[] = [
    {
      id: 'hero-principal',
      tipo: 'hero',
      titulo: 'Festival de Arte e Cultura de Irecê',
      subtitulo: 'Centenário da Cidade — Chamamento Público 02/2026',
      descricao:
        'Inscreva sua proposta artístico-cultural no Festival de Arte e Cultura de Irecê — Ano do Centenário. 15 categorias, mais de R$ 360 mil em fomento, cotas para pessoas negras, indígenas e com deficiência.',
      imagemUrl: '/images/banner/novo_banner/novo_editais.jpeg',
      badge: 'Destaque · Inscrições Abertas',
      badgeVariant: 'warning',
      ctaLabel: 'Ver Edital',
      ctaUrl: '/editais/festival-arte-cultura-irece-centenario-2026',
      ctaSecondaryLabel: 'Cadastrar-se como Proponente',
      ctaSecondaryUrl: '/cadastro',
    },
  ]

  // Slides admin (Banner Destaque) — controlados pela secretaria
  for (let i = 0; i < slidesAdmin.length; i++) {
    const slide = slidesAdmin[i]
    heroSlides.push({
      id: `slide-${slide.id}`,
      tipo: 'custom',
      titulo: slide.titulo,
      descricao: slide.descricao ?? '',
      imagemUrl: slide.imagemUrl || realBannerImages[(i + 1) % realBannerImages.length],
      ctaLabel: slide.ctaLabel ?? 'Saiba mais',
      ctaUrl: slide.ctaUrl ?? '#',
    })
  }

  // Slides seguintes: editais reais do banco com fotos reais
  for (let i = 0; i < editaisDestaque.length; i++) {
    const ed = editaisDestaque[i]
    const statusInfo = getStatusDisplay(ed.status)
    const nextDeadline = getNextDeadline(ed.cronograma)
    const desc = [
      nextDeadline ? `${nextDeadline.label}: ${formatDate(nextDeadline.dataHora)}` : null,
      ed.valorTotal ? `Valor: ${formatCurrency(ed.valorTotal)}` : null,
    ].filter(Boolean).join(' · ')

    heroSlides.push({
      id: `edital-${ed.id}`,
      tipo: 'edital',
      titulo: ed.titulo,
      descricao: desc || 'Confira o edital completo e inscreva seu projeto cultural.',
      imagemUrl: realBannerImages[(i + 1) % realBannerImages.length],
      badge: statusInfo.label,
      badgeVariant: statusInfo.badgeVariant as SlideData['badgeVariant'],
      ctaLabel: 'Ver edital',
      ctaUrl: `/editais/${ed.slug}`,
    })
  }

  // Se não há editais reais, adicionar editais fictícios com fotos reais
  if (editaisDestaque.length === 0) {
    heroSlides.push(
      {
        id: 'ficticio-1',
        tipo: 'edital',
        titulo: 'Edital de Fomento à Cultura — Audiovisual 2026',
        descricao: 'Inscrições abertas até 30/06/2026 · Valor: R$ 500.000',
        imagemUrl: '/images/banner/foto_site (3).png',
        badge: 'Inscrições Abertas',
        badgeVariant: 'success',
        ctaLabel: 'Ver edital',
        ctaUrl: '/editais',
      },
      {
        id: 'ficticio-2',
        tipo: 'edital',
        titulo: 'Prêmio Irecê de Cultura Popular',
        descricao: 'Valorização das manifestações culturais tradicionais do município · Valor: R$ 200.000',
        imagemUrl: '/images/banner/foto_site (3).png',
        badge: 'Em breve',
        badgeVariant: 'warning',
        ctaLabel: 'Ver edital',
        ctaUrl: '/editais',
      },
      {
        id: 'ficticio-3',
        tipo: 'edital',
        titulo: 'Fomento a Espaços Culturais Independentes',
        descricao: 'Apoio à manutenção de espaços culturais comunitários · Valor: R$ 300.000',
        imagemUrl: '/images/banner/foto_site (4).png',
        badge: 'Publicado',
        badgeVariant: 'neutral',
        ctaLabel: 'Ver edital',
        ctaUrl: '/editais',
      },
    )
  }

  const valorTotal = totalFomento._sum.valorTotal
    ? Number(totalFomento._sum.valorTotal)
    : 0
  const valorFormatado = valorTotal > 0
    ? valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : '—'

  return (
    <>
      {/* Hero Carrossel em Destaque */}
      <HeroCarousel slides={heroSlides} />

      {/* Barra de Números */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8" staggerDelay={0.15}>
            {[
              { value: String(editaisAbertos || '—'), label: 'Editais Abertos', color: 'text-brand-700' },
              { value: valorFormatado, label: 'Valor em Fomento', color: 'text-brand-700' },
              { value: projetosCount > 0 ? String(projetosCount) : '—', label: 'Projetos Apoiados', color: 'text-brand-700' },
              { value: '100%', label: 'Online', color: 'text-accent-700' },
            ].map((item) => (
              <StaggerItem key={item.label} className="text-center">
                <CountUp value={item.value} className={`text-xl sm:text-2xl font-bold ${item.color}`} />
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  {item.label}
                </p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* 1. Editais em destaque — Posicionado LOGO APÓS O HERO/MÉTRICAS (sugestão Dr. Leandro) */}
      <section className="bg-slate-50 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="section-label text-brand-600 mb-1">Oportunidades em Destaque</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Editais Abertos & Inscrições
                </h2>
                <p className="mt-1 text-slate-600 text-sm sm:text-base">
                  Confira os editais disponíveis e faça sua inscrição online.
                </p>
              </div>
              <Link
                href="/editais"
                className="hidden sm:inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Ver todos os editais
                <IconArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </FadeIn>

          {editaisDestaque.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.12}>
              {editaisDestaque.map((edital, index) => {
                const statusInfo = getStatusDisplay(edital.status)
                const nextDeadline = getNextDeadline(edital.cronograma)
                const categoria = edital.categorias[0] ?? '—'

                return (
                  <StaggerItem key={edital.id}>
                    <Card
                      hover
                      padding="md"
                      className={[
                        'flex flex-col h-full hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md',
                        index === 0 ? 'border-l-4 border-l-accent-500' : 'border-l-4 border-l-brand-500',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="section-label text-slate-500">
                          {categoria}
                        </span>
                        <Badge variant={statusInfo.badgeVariant} dot>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {edital.titulo}
                      </h3>
                      <div className="mt-auto pt-4 space-y-2 text-sm text-slate-600">
                        {nextDeadline && (
                          <p className="flex items-center gap-2">
                            <IconCalendar className="h-4 w-4 text-slate-400 shrink-0" />
                            {nextDeadline.label}: {formatDate(nextDeadline.dataHora)}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <IconCurrency className="h-4 w-4 text-slate-400 shrink-0" />
                          {formatCurrency(edital.valorTotal)}
                        </p>
                      </div>
                      <Button href={`/editais/${edital.slug}`} variant="outline" size="md" className="mt-4 w-full">
                        Ver detalhes
                      </Button>
                    </Card>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <p>Nenhum edital publicado no momento.</p>
            </div>
          )}

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/editais"
              className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Ver todos os editais
              <IconArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Como funciona (Passo a passo) — Logo após os editais (Espaçamento reduzido) */}
      <section className="bg-white py-8 sm:py-12 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mb-8">
            <p className="section-label text-brand-600 mb-1">Como Funciona</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Inscreva-se em 4 passos simples
            </h2>
          </FadeIn>

          <div className="relative">
            {/* Linha conectora (desktop) */}
            <div className="hidden lg:block absolute top-5 left-5 right-[25%] h-0.5 bg-slate-200" aria-hidden="true" />
            <div className="hidden lg:block absolute top-5 left-5 w-[37%] h-0.5 bg-gradient-to-r from-accent-400 to-brand-400 rounded-full" aria-hidden="true" />

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" staggerDelay={0.15} delay={0.1}>
              {[
                {
                  Icon: IconSearch,
                  label: '1. Consulta',
                  title: 'Consulte os editais',
                  description: 'Acesse os editais abertos acima, leia o regulamento e baixe os anexos.',
                  bgColor: 'bg-accent-50',
                  iconColor: 'text-accent-600',
                  ringColor: 'ring-accent-100',
                },
                {
                  Icon: IconClipboard,
                  label: '2. Cadastro',
                  title: 'Cadastre-se',
                  description: 'Crie sua conta como Pessoa Física, Jurídica ou Coletivo Cultural.',
                  bgColor: 'bg-brand-50',
                  iconColor: 'text-brand-600',
                  ringColor: 'ring-brand-100',
                },
                {
                  Icon: IconFileText,
                  label: '3. Inscrição',
                  title: 'Inscreva seu projeto',
                  description: 'Preencha o formulário, anexe documentos e envie sua proposta.',
                  bgColor: 'bg-brand-50',
                  iconColor: 'text-brand-600',
                  ringColor: 'ring-brand-100',
                },
                {
                  Icon: IconCheck,
                  label: '4. Resultado',
                  title: 'Acompanhe o resultado',
                  description: 'Receba notificações sobre habilitação, avaliação e resultado final.',
                  bgColor: 'bg-brand-50',
                  iconColor: 'text-brand-600',
                  ringColor: 'ring-brand-100',
                },
              ].map((item) => (
                <StaggerItem key={item.label} className="relative group">
                  <div className={`h-10 w-10 rounded-xl ${item.bgColor} flex items-center justify-center mb-3 relative z-10 transition-transform duration-300 group-hover:scale-110`}>
                    <item.Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <p className="section-label text-brand-600 mb-1">
                    {item.label}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Transparência + Atendimento */}
      <section className="bg-slate-50 py-8 sm:py-12 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8" staggerDelay={0.2}>
            {/* Transparência */}
            <StaggerItem>
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-600" />
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconEye className="h-6 w-6 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Transparência
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Prestação de contas pública
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Consulte os projetos culturais apoiados pela PNAB em Irecê.
                  Resultados, valores e contrapartidas disponíveis para toda a comunidade.
                </p>
                <Button href="/projetos-apoiados">
                  Ver projetos apoiados
                </Button>
              </div>
            </StaggerItem>

            {/* Atendimento */}
            <StaggerItem>
              <div className="relative bg-white rounded-2xl p-6 sm:p-8 lg:p-10 border border-slate-200 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent-500" />
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-accent-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconMail className="h-6 w-6 text-accent-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Atendimento
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Suporte e acompanhamento
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Tem dúvidas sobre editais ou inscrições? Envie sua mensagem
                  e receba um número de protocolo para acompanhamento.
                </p>
                <Button href="/contato" variant="secondary">
                  Entrar em contato
                </Button>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
    </>
  )
}
