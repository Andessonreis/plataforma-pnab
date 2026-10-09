import type { Metadata } from 'next'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { EventoForm } from '../evento-form'

export const metadata: Metadata = { title: 'Novo evento — Portal PNAB Irecê' }

export default async function NovoEventoPage() {
  await requireRole(...ROLES_MEMORIAL)
  const opcoes = await opcoesDeVinculo()

  return (
    <section>
      <CabecalhoPagina
        titulo="Novo evento"
        descricao="Começa como rascunho, fora do site. Com ano e descrição, ele pode ser publicado na linha do tempo."
        voltar={{ href: '/admin/memorial/pessoas?aba=eventos', rotulo: 'Linha do tempo' }}
      />
      <div className="max-w-3xl">
        <EventoForm opcoes={opcoes} />
      </div>
    </section>
  )
}
