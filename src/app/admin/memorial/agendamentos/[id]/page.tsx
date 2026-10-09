import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoAdmin } from '@/app/admin/memorial/_componentes/cabecalho-admin'
import { obterVisita } from '@/lib/services/memorial-agendamento-gestao.service'
import { ServiceError } from '@/lib/services/errors'
import { getConfig } from '@/lib/memorial/config'
import { acoesPossiveis, STATUS_REAGENDAVEIS } from '@/lib/memorial/agendamento/status'
import { dateParaDia } from '@/lib/memorial/agendamento/datas'
import { StatusVisita } from '../_componentes/status-visita'
import { DetalhesVisita } from './detalhes-visita'
import { AcoesVisita } from './acoes-visita'
import { ReagendarVisita } from './reagendar-visita'

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

export default async function VisitaPage({ params }: Props) {
  await requireRole('COMUNICACAO')
  const { id } = await params
  const [visita, visitacao] = await Promise.all([carregar(id), getConfig('visitacao')])
  const acoes = acoesPossiveis(visita.status)
  const reagendavel = STATUS_REAGENDAVEIS.includes(visita.status)

  return (
    <section>
      <CabecalhoAdmin
        titulo={visita.instituicao}
        descricao={`Protocolo ${visita.protocolo}`}
        voltar={{ href: '/admin/memorial/agendamentos', rotulo: 'Agendamentos' }}
      >
        <StatusVisita status={visita.status} />
      </CabecalhoAdmin>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <DetalhesVisita visita={visita} />

        <aside className="space-y-4 lg:sticky lg:top-20" aria-label="Ações">
          {acoes.length > 0 ? (
            <AcoesVisita id={visita.id} acoes={acoes} />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Esta visita já foi encerrada e não tem mais ações.
            </p>
          )}
          {reagendavel && (
            <ReagendarVisita
              id={visita.id}
              atual={{ data: dateParaDia(visita.data), turno: visita.turno, horaInicio: visita.horaInicio }}
              horarios={visitacao.horarios}
            />
          )}
        </aside>
      </div>
    </section>
  )
}
