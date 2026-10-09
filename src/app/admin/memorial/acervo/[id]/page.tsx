import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pendenciasItem } from '@/lib/memorial/publicacao'
import { obter } from '@/lib/services/memorial-acervo.service'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { PainelEdicao } from '../../_componentes/painel-edicao'
import { ItemForm } from '../item-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Editar item do acervo — Portal PNAB Irecê' }

export default async function EditarItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [item, opcoes] = await Promise.all([obter(id).catch(() => null), opcoesDeVinculo()])
  if (!item) notFound()

  return (
    <PainelEdicao
      titulo={item.titulo}
      voltar={{ href: '/admin/memorial/acervo', rotulo: 'Acervo' }}
      endpoint={`/api/v1/memorial/acervo/${id}`}
      status={item.status}
      pendencias={pendenciasItem(item)}
      entidade="MemorialAcervoItem"
      entidadeId={id}
      linkPublico={item.status === 'PUBLICADO' && item.tipo === 'FOTOGRAFIA' ? '/memorial/fotografias' : undefined}
      destinoExclusao="/admin/memorial/acervo"
    >
      <ItemForm item={item} opcoes={opcoes} />
    </PainelEdicao>
  )
}
