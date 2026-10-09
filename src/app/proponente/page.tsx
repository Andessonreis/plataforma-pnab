import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { statusVisivelParaProponente } from '@/lib/edital/resultado-habilitacao'
import { CabecalhoPagina } from './_componentes/cabecalho-pagina'
import { resolverAgora } from './agora'
import { AgoraPanel } from './agora-panel'
import { resolverConviteEditais } from './convite-editais'
import { ConviteEditaisPanel } from './convite-editais-panel'
import { carregarPainel } from './dashboard-data'
import { PASSOS_DASHBOARD } from './dashboard-tour-steps'
import { DraftInscricoesCard } from './draft-inscricoes-card'
import { GradePainel } from './grade-painel'
import { MemorialDestaque } from './memorial-destaque'
import { PrazosLista } from './prazos-lista'
import { posicaoDoMemorial } from './prioridade-memorial'
import { RecentInscricoesSection } from './recent-inscricoes-section'
import { RecentNotificationsCard } from './recent-notifications-card'

export const metadata: Metadata = {
  title: 'Minha Área — Portal PNAB Irecê',
}

export default async function ProponenteDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const painel = await carregarPainel(session.user.id)

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })

  const agora = resolverAgora({
    recursoPendente: painel.recursoPendente,
    nearestDeadline: painel.prazos[0] ?? null,
    draftCount: painel.draftCount,
    nearestDraft: painel.nearestDraft,
    editaisAbertosCount: painel.editaisAbertosCount,
  })

  // O prazo mais próximo já é o destaque do bloco "agora"; a lista traz só os que vêm depois.
  const prazosSeguintes = agora.tom === 'prazo' ? painel.prazos.slice(1) : painel.prazos

  const posicao = posicaoDoMemorial({
    temVisitasPorVir: painel.memorial.proximas.length > 0,
    totalInscricoes: painel.totalInscricoes,
    tomAgora: agora.tom,
  })
  // Sem inscrição em edital, o convite toma o lugar do "agora" e já lista os
  // prazos dos abertos, então a lista de prazos sai para não repetir.
  const convite = resolverConviteEditais(painel.totalInscricoes, painel.editaisVigentes)
  const memorial = <MemorialDestaque {...painel.memorial} compacto={posicao === 'memorial-abaixo'} />
  const blocoAgora = convite ? <ConviteEditaisPanel convite={convite} /> : <AgoraPanel agora={agora} />
  const prazos = !convite && prazosSeguintes.length > 0 ? <PrazosLista prazos={prazosSeguintes} /> : null

  // A primeira linha segue `posicaoDoMemorial`; quando o Memorial ocupa o
  // lugar ao lado da abertura, os prazos descem para o alto da pilha de apoio.
  const topo = {
    'memorial-agora': { abertura: memorial, aoLado: blocoAgora },
    'agora-memorial': { abertura: blocoAgora, aoLado: memorial },
    'memorial-abaixo': { abertura: blocoAgora, aoLado: prazos },
  }[posicao]

  return (
    <div className="mx-auto max-w-6xl space-y-10 lg:space-y-12">
      <CabecalhoPagina
        id="tour-painel-abertura"
        titulo="Painel do proponente"
        resumo={
          <>
            <span className="font-semibold text-papel-50">{session.user.name ?? 'Proponente'}</span>
            {', '}
            {hoje}
          </>
        }
        passosTour={PASSOS_DASHBOARD}
      />

      <GradePainel
        {...topo}
        dividida={convite !== null}
        principal={
          <RecentInscricoesSection
            inscricoes={painel.recentInscricoes.map((i) => ({
              ...i,
              status: statusVisivelParaProponente(i.status, i.resultadoLiberadoEm !== null),
            }))}
            total={painel.totalInscricoes}
            rascunhos={painel.draftCount}
            pendentes={painel.inscricoesPendentes}
            contempladas={painel.inscricoesContempladas}
            editaisAbertos={painel.editaisAbertosCount}
          />
        }
        apoio={
          <>
            {posicao !== 'memorial-abaixo' && prazos}
            <DraftInscricoesCard
              drafts={painel.draftInscricoes.map((d) => ({
                id: d.id,
                numero: d.numero,
                editalTitulo: d.edital.titulo,
                updatedAt: d.updatedAt,
              }))}
              totalDrafts={painel.draftCount}
            />
            <RecentNotificationsCard
              notifications={painel.recentNotifications}
              unreadCount={painel.unreadNotificationsCount}
            />
            {posicao === 'memorial-abaixo' && memorial}
          </>
        }
      />
    </div>
  )
}
