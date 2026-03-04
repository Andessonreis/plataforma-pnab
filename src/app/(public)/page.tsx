import type { Metadata } from 'next'
import Image from 'next/image'
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

export const metadata: Metadata = {
  title: 'Início',
  description:
    'Portal oficial da Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Arte e Cultura de Irecê/BA.',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

interface CronogramaItem {
  label: string
  dataHora: string
  destaque?: boolean
}

function getNextDeadline(cronograma: unknown): CronogramaItem | null {
  if (!Array.isArray(cronograma)) return null

  const now = new Date()
  const items = cronograma as CronogramaItem[]

  const future = items
    .filter((item) => item.dataHora && new Date(item.dataHora) > now)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())

  return future[0] ?? null
}

// ── Página ──────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Buscar métricas reais e editais em destaque
  const [editaisAbertos, totalFomento, projetosCount, editaisDestaque] = await Promise.all([
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
  ])

  const valorTotal = totalFomento._sum.valorTotal
    ? Number(totalFomento._sum.valorTotal)
    : 0
  const valorFormatado = valorTotal > 0
    ? valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : '—'

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[540px] sm:min-h-[600px] text-white overflow-hidden">
        <Image
          src="/images/hero-irece.jpg"
          alt="Cidade de Irecê — Cultura e tradição"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/40" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <FadeIn direction="up" delay={0.1}>
            <div className="max-w-3xl">
              <Badge variant="warning" className="mb-6 text-sm">
                Editais PNAB 2026
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                Portal da Política Nacional
                <br />
                Aldir Blanc — Irecê
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/85 leading-relaxed max-w-2xl">
                Acesse editais, inscreva seus projetos culturais, acompanhe resultados
                e consulte informações sobre o fomento à cultura no município de Irecê/BA.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button href="/editais" variant="secondary" size="lg" className="shadow-lg shadow-accent-500/25">
                  Ver Editais Abertos
                </Button>
                <Button
                  href="/cadastro"
                  variant="ghost"
                  size="lg"
                  className="bg-white/15 backdrop-blur-sm border border-white/25 text-white hover:bg-white/25 hover:text-white"
                >
                  Cadastrar-se como Proponente
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Barra de Números */}
      <section className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" staggerDelay={0.15}>
            {[
              { value: String(editaisAbertos || '—'), label: 'Editais Abertos', color: 'text-brand-700' },
              { value: valorFormatado, label: 'Valor em Fomento', color: 'text-brand-700' },
              { value: projetosCount > 0 ? String(projetosCount) : '—', label: 'Projetos Apoiados', color: 'text-brand-700' },
              { value: '100%', label: 'Online', color: 'text-accent-700' },
            ].map((item) => (
              <StaggerItem key={item.label} className="text-center">
                <CountUp value={item.value} className={`text-2xl font-bold ${item.color}`} />
                <p className="mt-1 text-sm text-slate-500">
                  {item.label}
                </p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mb-12">
            <p className="section-label text-brand-600 mb-2">Como funciona</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Inscreva-se em 4 passos simples
            </h2>
          </FadeIn>

          <div className="relative">
            {/* Linha conectora (desktop) */}
            <div className="hidden lg:block absolute top-5 left-5 right-[25%] h-0.5 bg-slate-200" aria-hidden="true" />
            <div className="hidden lg:block absolute top-5 left-5 w-[37%] h-0.5 bg-gradient-to-r from-accent-400 to-brand-400 rounded-full" aria-hidden="true" />

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.15} delay={0.2}>
              {[
                {
                  Icon: IconSearch,
                  label: 'Consulta',
                  title: 'Consulte os editais',
                  description: 'Acesse os editais abertos, leia o regulamento e baixe os anexos.',
                  bgColor: 'bg-accent-50',
                  iconColor: 'text-accent-600',
                  ringColor: 'ring-accent-100',
                },
                {
                  Icon: IconClipboard,
                  label: 'Cadastro',
                  title: 'Cadastre-se',
                  description: 'Crie sua conta como Pessoa Física, Jurídica ou Coletivo Cultural.',
                  bgColor: 'bg-brand-50',
                  iconColor: 'text-brand-600',
                  ringColor: 'ring-brand-100',
                },
                {
                  Icon: IconFileText,
                  label: 'Inscrição',
                  title: 'Inscreva seu projeto',
                  description: 'Preencha o formulário, anexe documentos e envie sua proposta.',
                  bgColor: 'bg-brand-50',
                  iconColor: 'text-brand-600',
                  ringColor: 'ring-brand-100',
                },
                {
                  Icon: IconCheck,
                  label: 'Resultado',
                  title: 'Acompanhe o resultado',
                  description: 'Receba notificações sobre habilitação, avaliação e resultado final.',
                  bgColor: 'bg-brand-50',
                  iconColor: 'text-brand-600',
                  ringColor: 'ring-brand-100',
                },
              ].map((item) => (
                <StaggerItem key={item.label} className="relative group">
                  <div className={`h-10 w-10 rounded-xl ${item.bgColor} flex items-center justify-center mb-4 relative z-10 transition-transform duration-300 group-hover:scale-110`}>
                    <item.Icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <p className="section-label text-brand-600 mb-1">
                    {item.label}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Editais em destaque */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="section-label text-brand-600 mb-2">Oportunidades</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Editais em destaque
                </h2>
                <p className="mt-2 text-slate-600">
                  Confira os editais abertos e não perca os prazos.
                </p>
              </div>
              <Link
                href="/editais"
                className="hidden sm:inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Ver todos
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
                        'flex flex-col h-full hover:-translate-y-0.5 transition-all duration-200',
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
            <div className="text-center py-12 text-slate-500">
              <p>Nenhum edital publicado no momento.</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/editais"
              className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver todos os editais
              <IconArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Transparência + Atendimento */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-8" staggerDelay={0.2}>
            {/* Transparência */}
            <StaggerItem>
              <div className="relative bg-brand-50/50 rounded-2xl p-8 lg:p-10 border border-brand-100 overflow-hidden group hover:shadow-lg hover:shadow-brand-100/50 transition-shadow duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600" />
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
              <div className="relative bg-accent-50/50 rounded-2xl p-8 lg:p-10 border border-accent-100 overflow-hidden group hover:shadow-lg hover:shadow-accent-100/50 transition-shadow duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-400 to-accent-600" />
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-accent-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
