import type { Metadata } from 'next'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../../require-role'
import { CabecalhoAdmin } from '../../../_componentes/cabecalho-admin'
import { EventoForm } from '../evento-form'

export const metadata: Metadata = { title: 'Novo evento — Portal PNAB Irecê' }

export default async function NovoEventoPage() {
  await requireRole('COMUNICACAO')
  const opcoes = await opcoesDeVinculo()

  return (
    <section>
      <CabecalhoAdmin
        titulo="Novo evento"
        voltar={{ href: '/admin/memorial/pessoas?aba=eventos', rotulo: 'Pessoas e eventos' }}
      />
      <EventoForm opcoes={opcoes} />
    </section>
  )
}
