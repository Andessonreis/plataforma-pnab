import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '../require-role'
import { getEditaisVisiveis } from '@/lib/edital-acesso'
import { prisma } from '@/lib/db'
import { getResumoDivulgacao } from '@/lib/services/divulgacao-habilitacao.service'
import { AbasStatus } from '@/components/abas-status'
import { BuscaFiltro } from '@/components/busca-filtro'
import { SomenteLeitura } from '@/components/espelho/somente-leitura'
import { DivulgarResultadoPanel } from './divulgar-resultado-panel'
import { CabecalhoHabilitacao } from './cabecalho-habilitacao'
import { ListaInscricoes } from './lista-inscricoes'
import { SelecaoEdital } from './selecao-edital'
import { AvisoEspelho } from './aviso-espelho'
import { resolverVisaoHabilitacao } from './visao-habilitacao'
import { ABAS, STATUS_HABILITACAO, type AbaKey } from './constantes'

export const metadata: Metadata = {
  title: 'Habilitação — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{
    aba?: string
    page?: string
    editalId?: string
    search?: string
  }>
}

export default async function AdminHabilitacaoPage({ searchParams }: Props) {
  const session = await requireRole('HABILITADOR', 'ADMIN')
  const { escopoId, espelho } = await resolverVisaoHabilitacao(session)
  const editaisVisiveis = escopoId ? await getEditaisVisiveis(escopoId, 'HABILITADOR') : null

  const params = await searchParams
  const editalIdFilter = params.editalId || undefined

  // Sem edital escolhido → tela de seleção, mesmo havendo só um edital.
  if (!editalIdFilter) {
    return (
      <>
        <AvisoEspelho nome={espelho} />
        <SelecaoEdital editaisVisiveis={editaisVisiveis} />
      </>
    )
  }

  const abaParam = (params.aba ?? 'pendentes') as AbaKey
  const abaAtiva: AbaKey = abaParam in ABAS ? abaParam : 'pendentes'
  const statusFiltro = ABAS[abaAtiva].status

  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const searchQuery = params.search?.trim() || undefined

  // Edital fora da equipe do Habilitador — trata como se não existisse
  // (mesmo destino do não encontrado, não vaza que o edital existe).
  if (editaisVisiveis && !editaisVisiveis.includes(editalIdFilter)) {
    redirect('/admin/habilitacao')
  }

  const edital = await prisma.edital.findUnique({
    where: { id: editalIdFilter },
    select: { id: true, titulo: true, ano: true, status: true },
  })
  if (!edital) redirect('/admin/habilitacao')

  const where: Record<string, unknown> = { status: statusFiltro, editalId: edital.id }
  if (searchQuery) {
    where.OR = [
      { numero: { contains: searchQuery, mode: 'insensitive' } },
      { proponente: { nome: { contains: searchQuery, mode: 'insensitive' } } },
      { proponente: { cpfCnpj: { contains: searchQuery } } },
    ]
  }

  const [inscricoes, total, contagens, resumoDivulgacao] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        proponente: { select: { nome: true, cpfCnpj: true } },
        _count: { select: { anexos: true } },
      },
    }),
    prisma.inscricao.count({ where }),
    prisma.inscricao.groupBy({
      by: ['status'],
      where: { editalId: edital.id, status: { in: STATUS_HABILITACAO } },
      _count: { _all: true },
    }),
    getResumoDivulgacao(edital.id),
  ])

  const countMap = Object.fromEntries(contagens.map((c) => [c.status, c._count._all]))
  const abasCount: Record<AbaKey, number> = {
    pendentes: countMap['ENVIADA'] ?? 0,
    habilitadas: countMap['HABILITADA'] ?? 0,
    inabilitadas: countMap['INABILITADA'] ?? 0,
  }

  const totalPages = Math.ceil(total / pageSize)
  const ativo = edital.status === 'HABILITACAO'

  function hrefAba(aba: AbaKey) {
    const sp = new URLSearchParams()
    sp.set('editalId', edital!.id)
    sp.set('aba', aba)
    if (searchQuery) sp.set('search', searchQuery)
    return `/admin/habilitacao?${sp.toString()}`
  }

  function detalheHref(inscricaoId: string) {
    const sp = new URLSearchParams()
    sp.set('editalId', edital!.id)
    sp.set('aba', abaAtiva)
    return `/admin/habilitacao/${inscricaoId}?${sp.toString()}`
  }

  return (
    <section>
      <AvisoEspelho nome={espelho} />

      <CabecalhoHabilitacao titulo={edital.titulo} ano={edital.ano} ativo={ativo} />

      <SomenteLeitura ativo={espelho !== null}>
        <DivulgarResultadoPanel editalId={edital.id} resumo={resumoDivulgacao} />
      </SomenteLeitura>

      <AbasStatus
        abas={(Object.keys(ABAS) as AbaKey[]).map((aba) => ({
          chave: aba,
          label: ABAS[aba].label,
          count: abasCount[aba],
          href: hrefAba(aba),
          alerta: aba === 'pendentes',
        }))}
        ativa={abaAtiva}
        rotulo="Filtrar por status de habilitação"
      />

      {/* Busca — o edital já está fixado pela escolha na tela anterior */}
      {(total > 0 || searchQuery) && (
        <BuscaFiltro
          action="/admin/habilitacao"
          campos={{ editalId: edital.id, aba: abaAtiva }}
          placeholder="Buscar por nome, CPF/CNPJ ou número da inscrição"
          valor={searchQuery}
          limparHref={`/admin/habilitacao?editalId=${edital.id}&aba=${abaAtiva}`}
        />
      )}

      <ListaInscricoes
        inscricoes={inscricoes}
        abaAtiva={abaAtiva}
        ativo={ativo}
        detalheHref={detalheHref}
        page={page}
        totalPages={totalPages}
        baseUrl={hrefAba(abaAtiva)}
      />
    </section>
  )
}
