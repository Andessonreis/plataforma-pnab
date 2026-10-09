import type { Metadata } from 'next'
import { Pagination } from '@/components/ui'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { paginationSchema } from '@/lib/schemas/pagination'
import { listarPublicas } from '@/lib/services/memorial-exposicao.service'
import { abertura } from '../_componentes/consultas'
import { ListaExposicoes } from '../_componentes/lista-exposicoes'
import { VazioMemorial } from '../_componentes/vazio-memorial'

export const metadata: Metadata = {
  title: 'Exposições',
  description: 'As exposições do Memorial de Irecê: recortes da história e da cultura da cidade.',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function ExposicoesPage({ searchParams }: Props) {
  const p = paginationSchema.catch({ page: 1, pageSize: 12 }).parse({ page: (await searchParams).page, pageSize: 10 })
  const [{ itens, total }, capa] = await Promise.all([listarPublicas(p), abertura()])

  return (
    <>
      <FolhaDeRosto
        compacto
        fotos={capa.fotos}
        trilha="Exposições do Memorial"
        chamada={capa.nome}
        titulo="Exposições"
        apoio="Cada exposição é um recorte da história de Irecê, com as fotografias, as pessoas e os acontecimentos que a contam."
      />
      <div className="papel-textura bg-papel-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {itens.length > 0 ? (
            <ListaExposicoes exposicoes={itens} tituloNivel="h2" />
          ) : (
            <VazioMemorial texto="Nenhuma exposição publicada por enquanto. Em breve as mostras do Memorial estarão aqui." />
          )}
          <Pagination currentPage={p.page} totalPages={Math.ceil(total / p.pageSize)} baseUrl="/memorial/exposicoes" className="mt-12" />
        </div>
      </div>
    </>
  )
}
