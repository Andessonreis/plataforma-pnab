import type { Metadata } from 'next'
import { EmptyState, Pagination } from '@/components/ui'
import { IconDocument } from '@/components/ui/icons'
import { AbasStatus, ABAS, type ChaveAba } from './abas-status'
import { consultarEditais } from './consulta'
import { DossieEdital } from './dossie-edital'
import { FolhaDeRosto } from './folha-de-rosto'

export const metadata: Metadata = {
  title: 'Editais',
  description: 'Consulte os editais de fomento à cultura da PNAB em Irecê/BA.',
}

interface SearchParams {
  status?: string
  page?: string
}

function urlDaAba(aba: ChaveAba): string {
  return aba === 'todos' ? '/editais' : `/editais?status=${aba}`
}

function descreverVazio(aba: ChaveAba): string {
  if (aba === 'abertos') {
    return 'Não há editais recebendo propostas neste momento. Os próximos serão anunciados aqui e nos canais da Secretaria.'
  }
  if (aba === 'encerrados') return 'Ainda não há editais encerrados para consulta.'
  return 'Nenhum edital publicado até agora.'
}

export default async function EditaisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const chaves = ABAS.map((a) => a.chave) as readonly string[]
  const abaAtiva: ChaveAba = chaves.includes(params.status ?? '')
    ? (params.status as ChaveAba)
    : 'todos'
  const paginaAtual = Math.max(1, Number(params.page) || 1)

  const { abertos, demais, totalPaginas, publicados, proximo } = await consultarEditais(
    abaAtiva,
    paginaAtual,
  )

  // `abertos` vem sempre preenchido para alimentar o resumo da abertura; a aba
  // Encerrados apenas não os lista.
  const emCartaz = abaAtiva === 'encerrados' ? [] : abertos

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        publicados={publicados}
        abertos={abertos.length}
        proximoEncerramento={proximo}
      />

      <section className="papel-textura bg-papel-50 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AbasStatus ativa={abaAtiva} />

          {emCartaz.length > 0 && (
            <div className="pt-10">
              <h2 className="titulo text-2xl tracking-wide text-tinta-900">
                {emCartaz.length === 1 ? 'Inscrição aberta' : 'Inscrições abertas'}
              </h2>
              <p className="mt-1 text-sm text-tinta-600">
                Editais recebendo propostas agora. Sem ordem de preferência entre eles.
              </p>

              <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {emCartaz.map((edital) => (
                  <DossieEdital key={edital.id} edital={edital} />
                ))}
              </ul>
            </div>
          )}

          {demais.length > 0 && (
            <div className="pt-14">
              <h2 className="titulo text-2xl tracking-wide text-tinta-900">
                {abaAtiva === 'encerrados' ? 'Editais encerrados' : 'Demais editais'}
              </h2>
              <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {demais.map((edital) => (
                  <DossieEdital key={edital.id} edital={edital} />
                ))}
              </ul>

              {totalPaginas > 1 && (
                <Pagination
                  currentPage={paginaAtual}
                  totalPages={totalPaginas}
                  baseUrl={urlDaAba(abaAtiva)}
                  className="mt-8"
                />
              )}
            </div>
          )}

          {emCartaz.length === 0 && demais.length === 0 && (
            <div className="py-20">
              <EmptyState
                icon={<IconDocument className="h-8 w-8 text-tinta-400" />}
                title="Nenhum edital nesta pilha"
                description={descreverVazio(abaAtiva)}
                action={
                  abaAtiva !== 'todos'
                    ? { label: 'Ver todos os editais', href: '/editais' }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
