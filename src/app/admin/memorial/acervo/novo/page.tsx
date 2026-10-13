import type { Metadata } from 'next'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { CabecalhoPagina } from '../../_ui'
import { ItemForm } from '../_componentes/item-form'

export const metadata: Metadata = { title: 'Novo item do acervo — Portal PNAB Irecê' }

export default async function NovoItemPage() {
  await requireRole(...ROLES_MEMORIAL)
  const opcoes = await opcoesDeVinculo()

  return (
    <section>
      <CabecalhoPagina
        titulo="Novo item do acervo"
        descricao="Para documentos, objetos, depoimentos ou uma foto com todos os dados. Para várias fotos de uma vez, use o envio na página do acervo."
        voltar={{ href: '/admin/memorial/acervo', rotulo: 'Acervo' }}
      />
      <ItemForm opcoes={opcoes} />
    </section>
  )
}
