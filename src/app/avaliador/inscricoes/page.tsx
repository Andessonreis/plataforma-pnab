import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getEditaisVisiveis } from '@/lib/edital-acesso'
import { viewNotaTotal } from '@/lib/services/avaliacao-view'
import { EDITAL_STATUS_COM_AVALIACAO } from '@/lib/services/avaliacao-buckets'
import { AbasStatus } from '@/components/abas-status'
import { BuscaFiltro } from '@/components/busca-filtro'
import {
  Card,
  Pagination,
  EmptyState,
  FadeIn,
  IconClipboard,
  IconArrowLeft,
} from '@/components/ui'
import { SelecaoEdital } from './edital-picker'
import { ListaInscricoes, type LinhaInscricao } from './lista-inscricoes'
import {
  ABAS_AVALIADOR,
  isAbaAvaliador,
  whereAba,
  whereInscricoesDoAvaliador,
  type AbaAvaliador,
} from './filtros'

export const metadata: Metadata = {
  title: 'Minhas Avaliações — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ editalId?: string; aba?: string; page?: string; search?: string }>
}

export default async function AvaliadorInscricoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session || session.user.role !== 'AVALIADOR') redirect('/login')

  const avaliadorId = session.user.id
  // AVALIADOR nunca cai no null de compatibilidade: só vê edital em que a
  // equipe do edital o inclui.
  const editaisVisiveis = (await getEditaisVisiveis(avaliadorId, 'AVALIADOR')) ?? []

  const params = await searchParams
  const editalIdFiltro = params.editalId || undefined

  if (!editalIdFiltro) {
    return <SelecaoEdital avaliadorId={avaliadorId} editaisVisiveis={editaisVisiveis} />
  }

  // Edital fora da equipe do avaliador — mesmo destino do inexistente, não
  // vaza que o edital existe.
  if (!editaisVisiveis.includes(editalIdFiltro)) {
    redirect('/avaliador/inscricoes')
  }

  const abaAtiva: AbaAvaliador = isAbaAvaliador(params.aba) ? params.aba : 'a_avaliar'
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 15
  const searchQuery = params.search?.trim() || undefined

  const edital = await prisma.edital.findFirst({
    where: { id: editalIdFiltro, status: { in: EDITAL_STATUS_COM_AVALIACAO } },
    select: { id: true, titulo: true, ano: true, status: true },
  })
  if (!edital) redirect('/avaliador/inscricoes')

  const escopo = whereInscricoesDoAvaliador([edital.id])
  const busca = searchQuery
    ? {
        OR: [
          { numero: { contains: searchQuery, mode: 'insensitive' as const } },
          { proponente: { nome: { contains: searchQuery, mode: 'insensitive' as const } } },
        ],
      }
    : null

  const where = {
    AND: [escopo, whereAba(abaAtiva, avaliadorId), ...(busca ? [busca] : [])],
  }

  const contagemDaAba = (aba: AbaAvaliador) => ({
    AND: [escopo, whereAba(aba, avaliadorId)],
  })

  const [inscricoes, total, contAAvaliar, contEmAvaliacao, contAvaliadas] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        numero: true,
        categoria: true,
        proponente: { select: { nome: true, cpfCnpj: true } },
        avaliacoes: {
          where: { avaliadorId },
          select: { finalizada: true, notaTotal: true },
        },
      },
    }),
    prisma.inscricao.count({ where }),
    prisma.inscricao.count({ where: contagemDaAba('a_avaliar') }),
    prisma.inscricao.count({ where: contagemDaAba('em_avaliacao') }),
    prisma.inscricao.count({ where: contagemDaAba('avaliadas') }),
  ])

  const linhas: LinhaInscricao[] = inscricoes.map((ins) => ({
    id: ins.id,
    numero: ins.numero,
    categoria: ins.categoria,
    proponenteNome: ins.proponente.nome,
    proponenteCpfCnpj: ins.proponente.cpfCnpj,
    nota: ins.avaliacoes[0] ? viewNotaTotal(ins.avaliacoes[0]) : null,
  }))

  const contagens: Record<AbaAvaliador, number> = {
    a_avaliar: contAAvaliar,
    em_avaliacao: contEmAvaliacao,
    avaliadas: contAvaliadas,
  }

  function href(aba: AbaAvaliador) {
    const sp = new URLSearchParams({ editalId: edital!.id, aba })
    if (searchQuery) sp.set('search', searchQuery)
    return `/avaliador/inscricoes?${sp.toString()}`
  }

  const totalPages = Math.ceil(total / pageSize)
  const emAvaliacao = edital.status === 'AVALIACAO'

  return (
    <section>
      <FadeIn>
        <header className="mb-4 sm:mb-6">
          {editaisVisiveis.length > 1 && (
            <Link
              href="/avaliador/inscricoes"
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium mb-3"
            >
              <IconArrowLeft className="h-4 w-4" />
              Trocar edital
            </Link>
          )}

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{edital.titulo}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Edição {edital.ano} <span className="text-slate-400">·</span>{' '}
            {emAvaliacao
              ? 'Fase de avaliação aberta'
              : 'Fase de avaliação encerrada — consulta ao histórico'}
          </p>
        </header>
      </FadeIn>

      <AbasStatus
        abas={(Object.keys(ABAS_AVALIADOR) as AbaAvaliador[]).map((aba) => ({
          chave: aba,
          label: ABAS_AVALIADOR[aba],
          count: contagens[aba],
          href: href(aba),
          alerta: aba === 'a_avaliar',
        }))}
        ativa={abaAtiva}
        rotulo="Filtrar por situação da sua avaliação"
      />

      <BuscaFiltro
        action="/avaliador/inscricoes"
        campos={{ editalId: edital.id, aba: abaAtiva }}
        placeholder="Buscar por nome do proponente ou número da inscrição"
        valor={searchQuery}
        limparHref={`/avaliador/inscricoes?editalId=${edital.id}&aba=${abaAtiva}`}
        className="mb-4 sm:mb-6"
      />

      {linhas.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title={
              abaAtiva === 'a_avaliar'
                ? 'Nenhuma inscrição aguardando sua avaliação'
                : abaAtiva === 'em_avaliacao'
                  ? 'Nenhuma avaliação em andamento'
                  : 'Nenhuma avaliação concluída ainda'
            }
            description="Troque de aba ou ajuste a busca para ver outras inscrições deste edital."
          />
        </Card>
      ) : (
        <>
          <ListaInscricoes inscricoes={linhas} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={href(abaAtiva)}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
