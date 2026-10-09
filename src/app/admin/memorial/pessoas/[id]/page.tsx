import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { pendenciasPessoa } from '@/lib/memorial/publicacao'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { obter } from '@/lib/services/memorial-pessoa.service'
import { requireRole } from '../../../require-role'
import { PainelEdicao } from '../../_componentes/painel-edicao'
import { PessoaForm } from '../pessoa-form'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Editar pessoa — Portal PNAB Irecê' }

export default async function EditarPessoaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [pessoa, opcoes] = await Promise.all([obter(id).catch(() => null), opcoesDeVinculo()])
  if (!pessoa) notFound()

  return (
    <PainelEdicao
      titulo={pessoa.nome}
      voltar={{ href: '/admin/memorial/pessoas', rotulo: 'Pessoas e eventos' }}
      endpoint={`/api/v1/memorial/pessoas/${id}`}
      status={pessoa.status}
      pendencias={pendenciasPessoa(pessoa)}
      entidade="MemorialPessoa"
      entidadeId={id}
      linkPublico={pessoa.status === 'PUBLICADO' ? `/memorial/pessoas/${pessoa.slug}` : undefined}
      destinoExclusao="/admin/memorial/pessoas"
    >
      <PessoaForm pessoa={pessoa} opcoes={opcoes} />
    </PainelEdicao>
  )
}
