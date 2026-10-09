import type { Metadata } from 'next'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { CabecalhoAdmin } from '../../_componentes/cabecalho-admin'
import { PessoaForm } from '../pessoa-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Nova pessoa — Portal PNAB Irecê' }

export default async function NovaPessoaPage() {
  await requireRole(...ROLES_MEMORIAL)
  const opcoes = await opcoesDeVinculo()

  return (
    <section>
      <CabecalhoAdmin titulo="Nova pessoa" voltar={{ href: '/admin/memorial/pessoas', rotulo: 'Pessoas e eventos' }} />
      <PessoaForm opcoes={opcoes} />
    </section>
  )
}
