import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pendenciasEvento } from '@/lib/memorial/publicacao'
import { obter } from '@/lib/services/memorial-evento.service'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../../require-role'
import { PainelEdicao } from '../../../_componentes/painel-edicao'
import { EventoForm } from '../evento-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Editar evento — Portal PNAB Irecê' }

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [evento, opcoes] = await Promise.all([obter(id).catch(() => null), opcoesDeVinculo()])
  if (!evento) notFound()

  return (
    <PainelEdicao
      titulo={evento.titulo}
      voltar={{ href: '/admin/memorial/pessoas?aba=eventos', rotulo: 'Pessoas e eventos' }}
      endpoint={`/api/v1/memorial/eventos/${id}`}
      status={evento.status}
      pendencias={pendenciasEvento(evento)}
      entidade="MemorialEvento"
      entidadeId={id}
      linkPublico={evento.status === 'PUBLICADO' ? '/memorial/linha-do-tempo' : undefined}
      destinoExclusao="/admin/memorial/pessoas?aba=eventos"
    >
      <EventoForm evento={evento} opcoes={opcoes} />
    </PainelEdicao>
  )
}
