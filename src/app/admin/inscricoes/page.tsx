import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, Pagination, EmptyState, FadeIn, IconClipboard } from '@/components/ui'
import { getRoleTheme } from '../role-theme'
import { buildInscricoesWhere } from './_lib/build-where'
import { CabecalhoInscricoes } from './_components/cabecalho'
import { StatusTabs } from './_components/status-tabs'
import { FiltrosInscricoes } from './_components/filtros'
import { ListaMobile } from './_components/lista-mobile'
import { TabelaDesktop } from './_components/tabela-desktop'
import type { UserRole } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Inscrições — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    page?: string
    status?: string
    editalId?: string
    categoria?: string
    search?: string
    aviso?: string
  }>
}

export default async function AdminInscricoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const statusFilter = params.status || undefined
  const editalIdFilter = params.editalId || undefined
  const areaFilter = params.categoria || undefined
  const searchQuery = params.search || undefined
  const aviso = params.aviso || undefined

  const role = session.user.role as UserRole
  const theme = getRoleTheme(role)
  const isAvaliador = role === 'AVALIADOR'
  const isHabilitador = role === 'HABILITADOR'

  const where = await buildInscricoesWhere(session.user.id, role, {
    statusFilter, editalIdFilter, areaFilter, searchQuery,
  })

  // Escopo sem o recorte de área: alimenta o <select> com todas as opções
  // visíveis pro usuário, mesmo quando uma área já está selecionada.
  const whereSemArea: Record<string, unknown> = { ...where }
  delete whereSemArea.categoria

  const [inscricoes, total, editais, agrupadoPorArea] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      // Agrupado por edital primeiro: numa lista com dezenas de editais, a
      // única coisa que separava um do outro antes era o texto repetido na
      // coluna Edital — ilegível em escala. As tabelas usam essa ordem pra
      // renderizar um cabeçalho de grupo em vez de repetir o nome a cada linha.
      orderBy: [{ edital: { titulo: 'asc' } }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        edital: { select: { titulo: true, slug: true } },
        proponente: { select: { nome: true, cpfCnpj: true, email: true } },
        ...(isAvaliador
          ? {
              avaliacoes: {
                where: { avaliadorId: session.user.id },
                select: { finalizada: true, notaTotal: true },
              },
            }
          : {
              _count: { select: { avaliacoes: true } },
            }),
      },
    }),
    prisma.inscricao.count({ where }),
    // Editais já concluídos (ENCERRADO/RESULTADO_FINAL) saem do filtro — não
    // há triagem a fazer neles, só teriam poluído a lista com opção morta.
    prisma.edital.findMany({
      where: { status: { notIn: ['ENCERRADO', 'RESULTADO_FINAL'] } },
      select: { id: true, titulo: true, ano: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inscricao.groupBy({
      by: ['categoria'],
      where: whereSemArea,
      _count: { _all: true },
    }),
  ])

  const areas = agrupadoPorArea
    .map((g) => ({ nome: g.categoria ?? '', total: g._count._all }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'))

  const totalPages = Math.ceil(total / pageSize)

  // Sem status/page — os tabs de status montam o próprio href em cima disso.
  const outrosParams = new URLSearchParams()
  if (editalIdFilter) outrosParams.set('editalId', editalIdFilter)
  if (areaFilter) outrosParams.set('categoria', areaFilter)
  if (searchQuery) outrosParams.set('search', searchQuery)

  const filterParams = new URLSearchParams(outrosParams)
  if (statusFilter) filterParams.set('status', statusFilter)
  const baseUrl = `/admin/inscricoes${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  return (
    <section>
      <FadeIn>
        <CabecalhoInscricoes isAvaliador={isAvaliador} total={total} avisoNaoAtribuido={aviso === 'nao-atribuido'} />
      </FadeIn>

      <StatusTabs activeStatus={statusFilter} outrosParams={outrosParams} ocultarRascunho={isHabilitador} />

      <FiltrosInscricoes
        searchQuery={searchQuery}
        editalIdFilter={editalIdFilter}
        statusFilter={statusFilter}
        areaFilter={areaFilter}
        editais={editais}
        areas={areas}
      />

      {inscricoes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-tinta-400" />}
            title={isAvaliador ? 'Nenhuma inscrição atribuída' : 'Nenhuma inscrição encontrada'}
            description={
              isAvaliador
                ? 'Você ainda não possui inscrições atribuídas para avaliação.'
                : 'Ajuste os filtros ou aguarde novas inscrições.'
            }
          />
        </Card>
      ) : (
        <>
          <ListaMobile inscricoes={inscricoes} isAvaliador={isAvaliador} />
          <TabelaDesktop inscricoes={inscricoes} isAvaliador={isAvaliador} linkColor={theme.chipText} />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
