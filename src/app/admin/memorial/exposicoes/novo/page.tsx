import type { Metadata } from 'next'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { CabecalhoAdmin } from '../../_componentes/cabecalho-admin'
import { ExposicaoForm } from '../exposicao-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Nova exposição — Portal PNAB Irecê' }

export default async function NovaExposicaoPage() {
  await requireRole(...ROLES_MEMORIAL)
  const opcoes = await opcoesDeVinculo()

  return (
    <section>
      <CabecalhoAdmin
        titulo="Nova exposição"
        descricao="Toda exposição nasce como rascunho. Ela só aparece no site depois de revisada, aprovada e publicada."
        voltar={{ href: '/admin/memorial/exposicoes', rotulo: 'Exposições' }}
      />
      <ExposicaoForm opcoes={opcoes} />
    </section>
  )
}
