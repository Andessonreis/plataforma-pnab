import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import type { EditalStatus } from '@prisma/client'
import {
  Badge,
  StatCard,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  IconArrowLeft,
  IconEdit,
  IconExternalLink,
  IconUsers,
  IconCurrency,
  IconTicket,
  IconTag,
} from '@/components/ui'
import { editalStatusLabel, editalStatusVariant } from '@/lib/status-maps'
import { formatCurrency } from '@/lib/utils/format'
import { GerarListasModal } from '../gerar-listas-modal'
import { RelatorioFinalButton } from './relatorio-final-button'
import { AvancarFasePanel } from './avancar-fase-panel'
import { EditalFaseStepper } from './edital-fase-stepper'
import { InscritosRecentes } from './inscritos-recentes'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const edital = await prisma.edital.findUnique({ where: { id }, select: { titulo: true } })
  return { title: `${edital?.titulo ?? id} — Portal PNAB Irecê` }
}

export default async function EditalOverviewPage({ params }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const { id } = await params
  const edital = await prisma.edital.findUnique({
    where: { id },
    include: { _count: { select: { inscricoes: true } } },
  })

  if (!edital) notFound()

  const [inscritosRecentes, inscritosEnviadosOuMais] = await Promise.all([
    prisma.inscricao.findMany({
      where: { editalId: id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        numero: true,
        categoria: true,
        status: true,
        createdAt: true,
        proponente: { select: { nome: true } },
      },
    }),
    prisma.inscricao.count({ where: { editalId: id, status: { not: 'RASCUNHO' } } }),
  ])

  const status = edital.status as EditalStatus
  const vagasLabel =
    edital.vagasContemplados != null
      ? `${edital.vagasContemplados}${edital.vagasSuplentes ? ` + ${edital.vagasSuplentes} suplentes` : ''}`
      : 'Ilimitado'

  const statusFinal: (typeof status)[] = ['RESULTADO_FINAL', 'ENCERRADO']

  const stats = [
    {
      label: 'Inscritos',
      value: edital._count.inscricoes,
      sub: `${inscritosEnviadosOuMais} enviada(s)`,
      color: 'bg-brand-50',
      iconColor: 'text-brand-600',
      icon: <IconUsers className="h-6 w-6" />,
      href: `/admin/inscricoes?editalId=${edital.id}`,
    },
    {
      label: 'Valor Total',
      value: formatCurrency(edital.valorTotal),
      sub: `${edital.categorias.length} categoria(s)`,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
      icon: <IconCurrency className="h-6 w-6" />,
    },
    {
      label: 'Vagas',
      value: vagasLabel,
      sub: 'contemplados',
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
      icon: <IconTicket className="h-6 w-6" />,
    },
    {
      label: 'Categorias',
      value: edital.categorias.length,
      sub: edital.categorias.slice(0, 2).join(', ') || 'nenhuma',
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      icon: <IconTag className="h-6 w-6" />,
    },
  ]

  return (
    <section>
      <FadeIn>
        <div className="mb-6">
          <Link
            href="/admin/editais"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mb-3"
          >
            <IconArrowLeft className="h-4 w-4" />
            Voltar para Editais
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant={editalStatusVariant[status]}>{editalStatusLabel[status]}</Badge>
                <span className="text-sm text-slate-500">{edital.ano}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{edital.titulo}</h1>
              {edital.resumo && <p className="text-slate-600 mt-1.5 max-w-2xl">{edital.resumo}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={`/editais/${edital.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <IconExternalLink className="h-4 w-4" />
                Ver página pública
              </Link>
              <Link
                href={`/admin/editais/${edital.id}/editar`}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                <IconEdit className="h-4 w-4" />
                Editar
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <StatCard {...stat} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn delay={0.15}>
        <div className="mb-6 sm:mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Andamento do Edital</h2>
          <EditalFaseStepper statusAtual={status} />
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
          <Link
            href={`/admin/editais/${edital.id}/resultados`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Ver Resultados
          </Link>
          <GerarListasModal editalId={edital.id} editalTitulo={edital.titulo} editalStatus={status} />
          {statusFinal.includes(status) && <RelatorioFinalButton editalId={edital.id} />}
        </div>
      </FadeIn>

      <FadeIn delay={0.25}>
        <InscritosRecentes
          editalId={edital.id}
          total={edital._count.inscricoes}
          inscritos={inscritosRecentes.map((i) => ({ ...i, status: i.status }))}
        />
      </FadeIn>

      <div className="mt-10">
        <AvancarFasePanel editalId={edital.id} statusAtual={status} />
      </div>
    </section>
  )
}
