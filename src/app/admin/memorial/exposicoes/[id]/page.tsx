import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconExternalLink } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { obter } from '@/lib/services/memorial-exposicao.service'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../../require-role'
import { CabecalhoPagina, botaoNeutro } from '../../_ui'
import { AcervoMaisOpcoes } from '../../_ui/acervo-mais-opcoes'
import { miniaturasDoAcervo } from '../../_ui/acervo-miniaturas'
import { ExposicaoForm } from '../_componentes/exposicao-form'

export const metadata: Metadata = { title: 'Editar exposição — Portal PNAB Irecê' }

export default async function EditarExposicaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const [exposicao, opcoes, acervo] = await Promise.all([obter(id).catch(() => null), opcoesDeVinculo(), miniaturasDoAcervo()])
  if (!exposicao) notFound()

  return (
    <section>
      <CabecalhoPagina
        titulo={exposicao.titulo}
        voltar={{ href: '/admin/memorial/exposicoes', rotulo: 'Exposições' }}
        acoes={
          exposicao.status === 'PUBLICADO' && (
            <Link href={`/memorial/exposicoes/${exposicao.slug}`} target="_blank" className={botaoNeutro}>
              Ver no site
              <IconExternalLink className="h-4 w-4" />
            </Link>
          )
        }
      />
      <ExposicaoForm exposicao={exposicao} opcoes={opcoes} acervo={acervo} />
      <AcervoMaisOpcoes
        entidade="MemorialExposicao"
        entidadeId={id}
        endpoint={`/api/v1/memorial/exposicoes/${id}`}
        nome={exposicao.titulo}
        destinoExclusao="/admin/memorial/exposicoes"
      />
    </section>
  )
}
