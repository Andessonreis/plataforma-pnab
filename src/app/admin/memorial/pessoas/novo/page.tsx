import type { Metadata } from 'next'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { PessoaForm } from '../pessoa-form'

export const metadata: Metadata = { title: 'Nova pessoa — Portal PNAB Irecê' }

export default async function NovaPessoaPage() {
  await requireRole(...ROLES_MEMORIAL)
  const opcoes = await opcoesDeVinculo()

  return (
    <section>
      <CabecalhoPagina
        titulo="Nova pessoa"
        descricao="Começa como rascunho, fora do site. Depois de cadastrar, a página mostra o caminho até a publicação."
        voltar={{ href: '/admin/memorial/pessoas', rotulo: 'Pessoas e eventos' }}
      />
      <div className="max-w-3xl">
        <PessoaForm opcoes={opcoes} />
      </div>
    </section>
  )
}
