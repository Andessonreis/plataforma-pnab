import type { Metadata } from 'next'
import { EmptyState, Pagination } from '@/components/ui'
import { IconNews } from '@/components/ui/icons'
import { consultarNoticiario } from './consulta'
import { EntradaNoticia } from './entrada-noticia'
import { FolhaDeRosto } from './folha-de-rosto'
import { Manchete } from './manchete'

export const metadata: Metadata = {
  title: 'Notícias',
  description:
    'Acompanhe as últimas notícias sobre editais, eventos culturais e a política de fomento à cultura em Irecê/BA.',
}

interface NoticiasPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function NoticiasPage({ searchParams }: NoticiasPageProps) {
  const params = await searchParams
  const pagina = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1)

  const { manchete, demais, total, totalPaginas, ultimaPublicacao } =
    await consultarNoticiario(pagina)

  const vazio = !manchete && demais.length === 0

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto total={total} ultimaPublicacao={ultimaPublicacao} />

      <section className="papel-textura bg-papel-50 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {vazio ? (
            <div className="py-20">
              <EmptyState
                icon={<IconNews className="h-8 w-8 text-tinta-400" />}
                title="Nenhuma notícia publicada ainda"
                description="Assim que houver novidade sobre editais, resultados ou eventos, ela aparece aqui."
              />
            </div>
          ) : (
            <>
              {manchete && (
                <div className="pt-10">
                  <Manchete noticia={manchete} />
                </div>
              )}

              {demais.length > 0 && (
                <div className={manchete ? 'pt-14' : 'pt-10'}>
                  {manchete && (
                    <h2 className="mb-2 titulo text-2xl tracking-wide text-tinta-900">
                      Mais notícias
                    </h2>
                  )}
                  <div className="grid gap-x-10 md:grid-cols-2 xl:grid-cols-3">
                    {demais.map((noticia) => (
                      <EntradaNoticia key={noticia.id} noticia={noticia} />
                    ))}
                  </div>
                </div>
              )}

              {totalPaginas > 1 && (
                <Pagination
                  currentPage={pagina}
                  totalPages={totalPaginas}
                  baseUrl="/noticias"
                  className="mt-12"
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
