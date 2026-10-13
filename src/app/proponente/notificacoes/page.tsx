import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Pagination } from '@/components/ui'
import { AbasFiltro } from '@/components/ui/abas-filtro'
import { CabecalhoPagina } from '../_componentes/cabecalho-pagina'
import { VazioPainel } from '../vazio-painel'
import { agruparPorDia } from './agrupar-por-dia'
import { DiaNotificacoes } from './dia-notificacoes'
import { MarkAllReadButton } from './mark-all-read-button'
import { PASSOS_NOTIFICACOES } from './notificacoes-tour-steps'

export const metadata: Metadata = {
  title: 'Minhas Notificações — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; lida?: string }>
}

const TAMANHO_PAGINA = 20

/** Estado vazio de cada filtro: diz o que costuma chegar aqui e para onde ir. */
const VAZIO = {
  todas: {
    titulo: 'Nenhum aviso por enquanto.',
    texto:
      'A Secretaria avisa por aqui, e também por e-mail, quando sua inscrição é recebida, quando sai um resultado, quando abre prazo de recurso e quando há convocação.',
    acao: { href: '/proponente/inscricoes', rotulo: 'Ver minhas inscrições' },
  },
  naoLidas: {
    titulo: 'Nenhum aviso novo.',
    texto: 'Você já leu tudo o que chegou. Os avisos lidos continuam guardados.',
    acao: { href: '/proponente/notificacoes', rotulo: 'Ver todos os avisos' },
  },
  lidas: {
    titulo: 'Nenhum aviso lido ainda.',
    texto: 'Os avisos que você abrir ou marcar como lidos ficam guardados neste filtro.',
    acao: { href: '/proponente/notificacoes', rotulo: 'Ver todos os avisos' },
  },
}

export default async function ProponenteNotificacoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const lidaFilter = params.lida === 'true' || params.lida === 'false' ? params.lida : ''

  const where: Prisma.NotificationWhereInput = { userId: session.user.id }
  if (lidaFilter === 'true') where.lidaEm = { not: null }
  if (lidaFilter === 'false') where.lidaEm = null

  const [items, total, totalUnread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * TAMANHO_PAGINA,
      take: TAMANHO_PAGINA,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: session.user.id, lidaEm: null } }),
  ])

  const grupos = agruparPorDia(items)
  const baseUrl = lidaFilter ? `/proponente/notificacoes?lida=${lidaFilter}` : '/proponente/notificacoes'
  const vazio = lidaFilter === 'false' ? VAZIO.naoLidas : lidaFilter === 'true' ? VAZIO.lidas : VAZIO.todas

  const abas = [
    { chave: '', label: 'Todos', href: '/proponente/notificacoes' },
    { chave: 'false', label: totalUnread > 0 ? `Não lidos (${totalUnread})` : 'Não lidos', href: '/proponente/notificacoes?lida=false' },
    { chave: 'true', label: 'Lidos', href: '/proponente/notificacoes?lida=true' },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <CabecalhoPagina
        id="tour-notificacoes-header"
        titulo="Notificações"
        resumo={
          totalUnread > 0
            ? `${totalUnread === 1 ? 'Um aviso ainda não foi lido' : `${totalUnread} avisos ainda não foram lidos`}.`
            : 'Avisos da Secretaria sobre suas inscrições e os editais.'
        }
        passosTour={PASSOS_NOTIFICACOES}
        acoes={totalUnread > 0 ? <MarkAllReadButton naoLidas={totalUnread} /> : undefined}
      />

      <div id="tour-notificacoes-filtros" className="mt-8">
        <AbasFiltro abas={abas} ativa={lidaFilter} rotulo="Filtrar avisos" />
      </div>

      {grupos.length === 0 ? (
        <div className="mt-6">
          <VazioPainel titulo={vazio.titulo} texto={vazio.texto} acao={vazio.acao} />
        </div>
      ) : (
        <div id="tour-notificacoes-lista" className="mt-8 space-y-10">
          {grupos.map((grupo, index) => (
            <DiaNotificacoes key={grupo.chave} grupo={grupo} destaqueTour={index === 0} />
          ))}
        </div>
      )}

      <div id="tour-notificacoes-paginacao">
        <Pagination currentPage={page} totalPages={Math.ceil(total / TAMANHO_PAGINA)} baseUrl={baseUrl} className="mt-8" />
      </div>
    </div>
  )
}
