import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconExternalLink } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { obter } from '@/lib/services/memorial-acervo.service'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { CabecalhoPagina, botaoNeutro } from '../../_ui'
import { AcervoMaisOpcoes } from '../../_ui/acervo-mais-opcoes'
import { ItemForm } from '../_componentes/item-form'

export const metadata: Metadata = { title: 'Editar item do acervo — Portal PNAB Irecê' }

export default async function EditarItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [item, opcoes] = await Promise.all([obter(id).catch(() => null), opcoesDeVinculo()])
  if (!item) notFound()
  const endpoint = `/api/v1/memorial/acervo/${id}`
  const noSite = item.status === 'PUBLICADO' && item.tipo === 'FOTOGRAFIA'

  return (
    <section>
      <CabecalhoPagina
        titulo={item.titulo}
        voltar={{ href: '/admin/memorial/acervo', rotulo: 'Acervo' }}
        acoes={
          noSite && (
            <Link href="/memorial/fotografias" target="_blank" className={botaoNeutro}>
              Ver no site
              <IconExternalLink className="h-4 w-4" />
            </Link>
          )
        }
      />
      <ItemForm item={item} opcoes={opcoes} />
      <AcervoMaisOpcoes
        entidade="MemorialAcervoItem"
        entidadeId={id}
        endpoint={endpoint}
        nome={item.titulo}
        destinoExclusao="/admin/memorial/acervo"
      />
    </section>
  )
}
