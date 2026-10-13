import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina, StatusChip } from '@/app/admin/memorial/_ui'
import { chegouHa } from '@/app/admin/memorial/_ui/agenda-tempo'
import { listarCalendario, obterVisita } from '@/lib/services/memorial-agendamento-gestao.service'
import { ServiceError } from '@/lib/services/errors'
import { getConfig } from '@/lib/memorial/config'
import { acoesPossiveis, STATUS_REAGENDAVEIS } from '@/lib/memorial/agendamento/status'
import { dateParaDia, diaEmIrece } from '@/lib/memorial/agendamento/datas'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { DecisaoRapida } from '../_componentes/decisao-rapida'
import { DetalhesVisita } from './detalhes-visita'
import { AcoesVisita } from './acoes-visita'
import { ReagendarVisita } from './reagendar-visita'
import { ResumoVisita } from './resumo-visita'
import { MesmoDia } from './mesmo-dia'
import { conflitosDaVisita } from './conflitos'

export const metadata: Metadata = { title: 'Pedido de visita — Memorial' }

interface Props {
  params: Promise<{ id: string }>
}

async function carregar(id: string) {
  try {
    return await obterVisita(id)
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') notFound()
    throw err
  }
}

/** Detalhe do pedido: o resumo e a agenda do dia de um lado, a decisão do outro. */
export default async function VisitaPage({ params }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [visita, visitacao] = await Promise.all([carregar(id), getConfig('visitacao')])
  const dia = dateParaDia(visita.data)
  const doDia = await listarCalendario(dia, dia)
  const acoes = acoesPossiveis(visita.status)
  const reagendavel = STATUS_REAGENDAVEIS.includes(visita.status)
  const naBarra = acoes.includes('CONFIRMAR') ? (['CONFIRMAR', 'RECUSAR'] as const) : []
  const conflitos = conflitosDaVisita(visita, doDia, visitacao)

  return (
    <div className={naBarra.length ? 'pb-32 lg:pb-0' : ''}>
      <CabecalhoPagina
        titulo={visita.instituicao}
        descricao={`Pedido ${visita.protocolo}. ${chegouHa(visita.createdAt)}.`}
        voltar={{ href: '/admin/memorial/agendamentos', rotulo: 'Agenda de visitas' }}
        acoes={<StatusChip tipo="visita" status={visita.status} className="px-3 py-1 text-sm" />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-5">
          <ResumoVisita visita={visita} hoje={diaEmIrece(new Date())} />
          <section aria-labelledby="dia-titulo" className="rounded-xl border border-tinta-900/15 bg-white p-4 sm:p-5">
            <h2 id="dia-titulo" className="mb-3 text-sm font-bold text-tinta-900">
              Agenda deste dia
            </h2>
            <MesmoDia visitaId={visita.id} doDia={doDia} conflitos={conflitos} />
          </section>
          <DetalhesVisita visita={visita} />
        </div>

        <aside aria-labelledby="decisao-titulo" className="space-y-4 rounded-xl border border-tinta-900/15 bg-white p-4 sm:p-5 lg:sticky lg:top-20">
          <h2 id="decisao-titulo" className="text-base font-bold text-tinta-900">
            Sua decisão
          </h2>
          {acoes.length > 0 ? (
            <AcoesVisita id={visita.id} acoes={acoes} naBarra={[...naBarra]} />
          ) : (
            <p className="text-sm text-tinta-700">Esta visita já foi encerrada e não tem mais ações.</p>
          )}
          {reagendavel && (
            <ReagendarVisita
              id={visita.id}
              atual={{ data: dia, turno: visita.turno, horaInicio: visita.horaInicio }}
              horarios={visitacao.horarios}
            />
          )}
        </aside>
      </div>

      {naBarra.length > 0 && <DecisaoRapida id={visita.id} rotulo={visita.instituicao} variante="barra" />}
    </div>
  )
}
