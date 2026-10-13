import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { pendenciasEvento } from '@/lib/memorial/publicacao'
import { obter } from '@/lib/services/memorial-evento.service'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '@/app/admin/require-role'
import { PainelConteudo } from '../../_edicao/painel-conteudo'
import { EventoForm } from '../evento-form'

export const metadata: Metadata = { title: 'Editar evento — Portal PNAB Irecê' }

const LISTA = '/admin/memorial/pessoas?aba=eventos'

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [evento, opcoes] = await Promise.all([obter(id).catch(() => null), opcoesDeVinculo()])
  if (!evento) notFound()

  return (
    <PainelConteudo
      titulo={evento.titulo}
      voltar={{ href: LISTA, rotulo: 'Linha do tempo' }}
      endpoint={`/api/v1/memorial/eventos/${id}`}
      status={evento.status}
      pendencias={pendenciasEvento(evento)}
      entidade="MemorialEvento"
      entidadeId={id}
      linkPublico={evento.status === 'PUBLICADO' ? '/memorial/linha-do-tempo' : undefined}
      destinoExclusao={LISTA}
    >
      <EventoForm evento={evento} opcoes={opcoes} />
    </PainelConteudo>
  )
}
