import type { Metadata } from 'next'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { CabecalhoAdmin } from '../../_componentes/cabecalho-admin'
import { ItemForm } from '../item-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Novo item do acervo — Portal PNAB Irecê' }

export default async function NovoItemPage() {
  await requireRole(...ROLES_MEMORIAL)
  const opcoes = await opcoesDeVinculo()

  return (
    <section>
      <CabecalhoAdmin
        titulo="Novo item do acervo"
        descricao="Para várias fotos de uma vez, use o envio de fotografias na página do acervo."
        voltar={{ href: '/admin/memorial/acervo', rotulo: 'Acervo' }}
      />
      <ItemForm opcoes={opcoes} />
    </section>
  )
}
