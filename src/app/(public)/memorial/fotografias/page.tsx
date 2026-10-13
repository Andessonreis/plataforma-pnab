import type { Metadata } from 'next'
import { Pagination } from '@/components/ui'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { rotuloDecada } from '@/lib/memorial/rotulos'
import { listagemAcervoPublicoSchema } from '@/lib/schemas/memorial-acervo'
import { decadasPublicadas, listarPublicos } from '@/lib/services/memorial-acervo.service'
import { listarPublicos as listarAlbuns } from '@/lib/services/memorial-album.service'
import { abertura, fotosPublicas } from '../_componentes/consultas'
import { GradeFotos } from '../_componentes/grade-fotos'
import { VazioMemorial } from '../_componentes/vazio-memorial'
import { FiltrosGaleria } from './filtros-galeria'

export const metadata: Metadata = {
  title: 'Fotografias',
  description: 'Fotografias do acervo do Memorial de Irecê, por década e por álbum.',
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const POR_PAGINA = 24

export default async function FotografiasPage({ searchParams }: Props) {
  const busca = await searchParams
  const lido = listagemAcervoPublicoSchema.safeParse({ ...busca, pageSize: POR_PAGINA, tipo: 'FOTOGRAFIA' })
  const f = lido.success ? lido.data : { page: 1, pageSize: POR_PAGINA, tipo: 'FOTOGRAFIA' as const }

  const [{ itens, total }, decadas, albuns, capa] = await Promise.all([
    listarPublicos(f),
    decadasPublicadas(),
    listarAlbuns({ page: 1, pageSize: 50 }),
    abertura(),
  ])
  const fotos = fotosPublicas(itens)
  const recorte = [f.decada && rotuloDecada(f.decada), albuns.itens.find((a) => a.slug === f.album)?.nome].filter(Boolean).join(', ')
  const baseUrl = `/memorial/fotografias?${new URLSearchParams(
    Object.entries({ decada: f.decada, album: f.album }).filter(([, v]) => v).map(([k, v]) => [k, String(v)]),
  )}`

  return (
    <>
      <FolhaDeRosto
        compacto
        fotos={capa.fotos}
        trilha="Fotografias do Memorial"
        chamada={capa.nome}
        titulo="Fotografias"
        apoio="Irecê de outras décadas, nas fotografias do acervo do Memorial."
      />
      <div className="papel-textura bg-papel-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <FiltrosGaleria decadas={decadas} albuns={albuns.itens} decada={f.decada} album={f.album} />
          <p className="text-sm text-tinta-700" aria-live="polite">
            {total} {total === 1 ? 'fotografia' : 'fotografias'}
            {recorte && ` em ${recorte}`}
          </p>
          {fotos.length > 0 ? (
            <GradeFotos fotos={fotos} />
          ) : (
            <VazioMemorial texto={recorte ? 'Nenhuma fotografia publicada neste recorte.' : 'As fotografias do acervo ainda estão sendo preparadas para publicação.'} />
          )}
          <Pagination currentPage={f.page} totalPages={Math.ceil(total / f.pageSize)} baseUrl={baseUrl} />
        </div>
      </div>
    </>
  )
}
