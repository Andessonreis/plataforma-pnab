import type { Metadata } from 'next'
import { Pagination } from '@/components/ui'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { paginationSchema } from '@/lib/schemas/pagination'
import { listarPublicas } from '@/lib/services/memorial-pessoa.service'
import { abertura } from '../_componentes/consultas'
import { RetratosPessoas } from '../_componentes/retratos-pessoas'
import { VazioMemorial } from '../_componentes/vazio-memorial'

export const metadata: Metadata = {
  title: 'Pessoas',
  description: 'Personagens da memória de Irecê: artistas, mestres, professores e quem fez a cultura da cidade.',
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function PessoasPage({ searchParams }: Props) {
  const p = paginationSchema.catch({ page: 1, pageSize: 24 }).parse({ page: (await searchParams).page, pageSize: 24 })
  const [{ itens, total }, capa] = await Promise.all([listarPublicas(p), abertura()])

  return (
    <>
      <FolhaDeRosto
        compacto
        fotos={capa.fotos}
        trilha="Pessoas do Memorial"
        chamada={capa.nome}
        titulo="Pessoas"
        apoio="Gente que fez a história e a cultura de Irecê."
      />
      <div className="papel-textura bg-papel-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {itens.length > 0 ? (
            <RetratosPessoas pessoas={itens} nivel="h2" />
          ) : (
            <VazioMemorial texto="Nenhuma biografia publicada por enquanto." />
          )}
          <Pagination currentPage={p.page} totalPages={Math.ceil(total / p.pageSize)} baseUrl="/memorial/pessoas" className="mt-12" />
        </div>
      </div>
    </>
  )
}
