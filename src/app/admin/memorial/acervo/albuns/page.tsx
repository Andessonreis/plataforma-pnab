import type { Metadata } from 'next'
import Link from 'next/link'
import { Pagination } from '@/components/ui'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import { listarAdmin } from '@/lib/services/memorial-album.service'
import { requireRole } from '../../../require-role'
import { CabecalhoAdmin } from '../../_componentes/cabecalho-admin'
import { lerFiltros } from '../../_componentes/parametros'
import { SecaoForm } from '../../_componentes/secao-form'
import { AlbumForm } from './album-form'

export const metadata: Metadata = { title: 'Álbuns do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function AlbunsPage({ searchParams }: Props) {
  await requireRole('COMUNICACAO')
  const f = lerFiltros(listagemAdminSchema, { pageSize: '20', ...(await searchParams) })
  const { itens, total } = await listarAdmin(f)

  return (
    <section className="max-w-4xl space-y-6">
      <CabecalhoAdmin
        titulo="Álbuns"
        descricao="Organizam as fotografias no site: Inauguração, São João, Re-Tratos do Tempo e o que mais a equipe precisar."
        voltar={{ href: '/admin/memorial/acervo', rotulo: 'Acervo' }}
      />

      <SecaoForm titulo="Novo álbum">
        <AlbumForm />
      </SecaoForm>

      <ul className="space-y-3">
        {itens.map((a) => (
          <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <details>
              <summary className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-x-3 text-sm">
                <span className="font-medium text-slate-900">{a.nome}</span>
                <Link
                  href={`/admin/memorial/acervo?albumId=${a.id}`}
                  className="text-slate-600 underline underline-offset-4 hover:text-slate-900"
                >
                  {a._count.itens} {a._count.itens === 1 ? 'item' : 'itens'}
                </Link>
              </summary>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <AlbumForm album={a} />
              </div>
            </details>
          </li>
        ))}
        {itens.length === 0 && <li className="text-sm text-slate-600">Nenhum álbum criado ainda.</li>}
      </ul>
      <Pagination currentPage={f.page} totalPages={Math.ceil(total / f.pageSize)} baseUrl="/admin/memorial/acervo/albuns" />
    </section>
  )
}
