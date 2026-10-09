import type { Metadata } from 'next'
import { Pagination } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import { listarAdmin } from '@/lib/services/memorial-album.service'
import { requireRole } from '../../../require-role'
import { lerFiltros } from '../../_componentes/parametros'
import { BlocoSecao, CabecalhoPagina } from '../../_ui'
import { miniaturasDoAcervo } from '../../_ui/acervo-miniaturas'
import { CartaoAlbum } from './cartao-album'
import { AlbumForm } from './album-form'

export const metadata: Metadata = { title: 'Álbuns do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const CAPA = 4

export default async function AlbunsPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const f = lerFiltros(listagemAdminSchema, { pageSize: '20', ...(await searchParams) })
  const [{ itens, total }, miniaturas] = await Promise.all([listarAdmin(f), miniaturasDoAcervo()])
  const capas = (albumId: string) =>
    miniaturas.filter((m) => m.albumId === albumId && m.imagem).slice(0, CAPA).map((m) => ({ id: m.id, imagem: m.imagem as string, titulo: m.titulo }))

  return (
    <section className="max-w-5xl space-y-6">
      <CabecalhoPagina
        titulo="Álbuns"
        descricao="Agrupam as fotografias no site: Inauguração, São João, Re-Tratos do Tempo e o que mais a equipe precisar."
        voltar={{ href: '/admin/memorial/acervo', rotulo: 'Acervo' }}
      />

      {itens.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {itens.map((a) => (
            <li key={a.id}>
              <CartaoAlbum album={a} quantidade={a._count.itens} capas={capas(a.id)}>
                <AlbumForm album={a} />
              </CartaoAlbum>
            </li>
          ))}
        </ul>
      )}
      <Pagination currentPage={f.page} totalPages={Math.ceil(total / f.pageSize)} baseUrl="/admin/memorial/acervo/albuns" />

      <BlocoSecao titulo="Criar álbum" dica={itens.length === 0 ? 'Nenhum álbum ainda. Comece pelo primeiro.' : undefined}>
        <AlbumForm />
      </BlocoSecao>
    </section>
  )
}
