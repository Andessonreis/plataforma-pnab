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

export const metadata: Metadata = {
  title: 'Início',
  description:
    'Portal oficial da Política Nacional Aldir Blanc de Fomento à Cultura — Secretaria de Arte e Cultura de Irecê/BA.',
}

export default async function HomePage() {
  // Buscar métricas reais
  const [editaisAbertos, totalFomento, projetosCount] = await Promise.all([
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
  ])

  const valorFormatado = totalFomento._sum.valorTotal
    ? `R$ ${Math.round(Number(totalFomento._sum.valorTotal) / 1000)} mil`
    : '—'

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[540px] sm:min-h-[600px] text-white overflow-hidden">
        <Image
          src="https://classepolitica.com.br/storage/noticias/irece-governo-murilo-franca-detalha-metas-fiscais-de-2025-em-audiencia-publica-nesta-sexta-feira539820439.jpeg"
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
            {/* Linha conectora horizontal (desktop) */}
            <div className="hidden lg:block absolute top-5 left-[calc(12.5%+12px)] right-[calc(12.5%+12px)] h-0.5 bg-slate-200" aria-hidden="true" />

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" staggerDelay={0.15} delay={0.2}>
              {[
                {
                  icon: IconSearch,
                  label: 'Consulta',
                  title: 'Consulte os editais',
                  description: 'Acesse os editais abertos, leia o regulamento e baixe os anexos.',
                  dotColor: 'bg-accent-500 ring-accent-100',
                },
                {
                  icon: IconClipboard,
                  label: 'Cadastro',
                  title: 'Cadastre-se',
                  description: 'Crie sua conta como Pessoa Física, Jurídica ou Coletivo Cultural.',
                  dotColor: 'bg-brand-500 ring-brand-100',
                },
                {
                  icon: IconFileText,
                  label: 'Inscrição',
                  title: 'Inscreva seu projeto',
                  description: 'Preencha o formulário, anexe documentos e envie sua proposta.',
                  dotColor: 'bg-brand-500 ring-brand-100',
                },
                {
                  icon: IconCheck,
                  label: 'Resultado',
                  title: 'Acompanhe o resultado',
                  description: 'Receba notificações sobre habilitação, avaliação e resultado final.',
                  dotColor: 'bg-brand-500 ring-brand-100',
                },
              ].map((item) => (
                <StaggerItem key={item.label} className="relative">
                  <div className={`h-10 w-10 rounded-full ${item.dotColor} ring-4 flex items-center justify-center mb-4 relative z-10 bg-white`}>
                    <div className={`h-3 w-3 rounded-full ${item.dotColor.split(' ')[0]}`} />
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

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.12}>
            {[
              {
                title: 'Edital de Audiovisual 2026',
                category: 'Audiovisual',
                status: 'Aberto' as const,
                deadline: 'Até 30/04/2026',
                value: 'R$ 150.000,00',
              },
              {
                title: 'Edital de Artes Cênicas 2026',
                category: 'Teatro / Dança',
                status: 'Aberto' as const,
                deadline: 'Até 15/05/2026',
                value: 'R$ 200.000,00',
              },
              {
                title: 'Edital de Patrimônio Cultural 2026',
                category: 'Patrimônio',
                status: 'Em breve' as const,
                deadline: 'Abertura: 01/04/2026',
                value: 'R$ 120.000,00',
              },
            ].map((edital, index) => (
              <StaggerItem key={edital.title}>
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
                      {edital.category}
                    </span>
                    <Badge variant={edital.status === 'Aberto' ? 'success' : 'warning'} dot>
                      {edital.status}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {edital.title}
                  </h3>
                  <div className="mt-auto pt-4 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-slate-400 shrink-0" />
                      {edital.deadline}
                    </p>
                    <p className="flex items-center gap-2">
                      <IconCurrency className="h-4 w-4 text-slate-400 shrink-0" />
                      {edital.value}
                    </p>
                  </div>
                  <Button href="/editais" variant="outline" size="md" className="mt-4 w-full">
                    Ver detalhes
                  </Button>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>

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
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-12" staggerDelay={0.2}>
            {/* Transparência */}
            <StaggerItem>
              <div className="bg-brand-50/50 rounded-2xl p-8 border-t-4 border-brand-500">
                <div className="flex items-center gap-3 mb-3">
                  <IconEye className="h-6 w-6 text-brand-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Transparência
                  </h2>
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
              <div className="bg-accent-50/50 rounded-2xl p-8 border-t-4 border-accent-500">
                <div className="flex items-center gap-3 mb-3">
                  <IconMail className="h-6 w-6 text-accent-600" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Atendimento
                  </h2>
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
