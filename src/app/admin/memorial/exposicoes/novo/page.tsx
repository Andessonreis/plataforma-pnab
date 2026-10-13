import type { Metadata } from 'next'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { CabecalhoPagina } from '../../_ui'
import { miniaturasDoAcervo } from '../../_ui/acervo-miniaturas'
import { ExposicaoForm } from '../_componentes/exposicao-form'

export const metadata: Metadata = { title: 'Nova exposição — Portal PNAB Irecê' }

export default async function NovaExposicaoPage() {
  await requireRole(...ROLES_MEMORIAL)
  const [opcoes, acervo] = await Promise.all([opcoesDeVinculo(), miniaturasDoAcervo()])

  return (
    <section>
      <CabecalhoPagina
        titulo="Nova exposição"
        descricao="Toda exposição nasce como rascunho. Ela só vai para o site depois de revisada, aprovada e publicada."
        voltar={{ href: '/admin/memorial/exposicoes', rotulo: 'Exposições' }}
      />
      <ExposicaoForm opcoes={opcoes} acervo={acervo} />
    </section>
  )
}
