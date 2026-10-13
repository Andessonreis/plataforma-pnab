import type { Metadata } from 'next'
import { Pagination } from '@/components/ui'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { paginationSchema } from '@/lib/schemas/pagination'
import { linhaDoTempo } from '@/lib/services/memorial-evento.service'
import { abertura } from '../_componentes/consultas'
import { LinhaDoTempo } from '../_componentes/linha-do-tempo'
import { VazioMemorial } from '../_componentes/vazio-memorial'

export const metadata: Metadata = {
  title: 'Linha do tempo',
  description: 'Os acontecimentos que marcaram a história e a cultura de Irecê, década a década.',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function LinhaDoTempoPage({ searchParams }: Props) {
  const p = paginationSchema.catch({ page: 1, pageSize: 50 }).parse({ page: (await searchParams).page, pageSize: 50 })
  const [{ itens, total }, capa] = await Promise.all([linhaDoTempo(p), abertura()])

  return (
    <>
      <FolhaDeRosto
        compacto
        fotos={capa.fotos}
        trilha="Linha do tempo do Memorial"
        chamada={capa.nome}
        titulo="Linha do tempo"
        apoio="Os acontecimentos registrados pelo Memorial, em ordem, década a década."
      />
      <div className="bg-tinta-950 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {itens.length > 0 ? (
            <LinhaDoTempo eventos={itens} />
          ) : (
            <div className="bg-papel-50 px-6">
              <VazioMemorial texto="Os acontecimentos da linha do tempo ainda estão sendo registrados pela equipe do Memorial." />
            </div>
          )}
          <Pagination currentPage={p.page} totalPages={Math.ceil(total / p.pageSize)} baseUrl="/memorial/linha-do-tempo" className="mt-12" />
        </div>
      </div>
    </>
  )
}
