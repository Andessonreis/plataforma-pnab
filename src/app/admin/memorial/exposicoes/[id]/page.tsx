import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pendenciasExposicao } from '@/lib/memorial/publicacao'
import { obter } from '@/lib/services/memorial-exposicao.service'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { PainelEdicao } from '../../_componentes/painel-edicao'
import { ExposicaoForm } from '../exposicao-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Editar exposição — Portal PNAB Irecê' }

export default async function EditarExposicaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [exposicao, opcoes] = await Promise.all([obter(id).catch(() => null), opcoesDeVinculo()])
  if (!exposicao) notFound()

  return (
    <PainelEdicao
      titulo={exposicao.titulo}
      voltar={{ href: '/admin/memorial/exposicoes', rotulo: 'Exposições' }}
      endpoint={`/api/v1/memorial/exposicoes/${id}`}
      status={exposicao.status}
      pendencias={pendenciasExposicao(exposicao)}
      entidade="MemorialExposicao"
      entidadeId={id}
      linkPublico={exposicao.status === 'PUBLICADO' ? `/memorial/exposicoes/${exposicao.slug}` : undefined}
      destinoExclusao="/admin/memorial/exposicoes"
    >
      <ExposicaoForm exposicao={exposicao} opcoes={opcoes} />
    </PainelEdicao>
  )
}
