import type { Metadata } from 'next'
import { EmptyState, FaixaNumeros, Pagination, type NumeroDestaque } from '@/components/ui'
import { Cartela } from '@/components/ui/cartela'
import { FaixaSecao } from '@/components/ui/faixa-secao'
import { IconDocument } from '@/components/ui/icons'
import { AbasStatus, ABAS, type ChaveAba } from './abas-status'
import { ArquivoPorAno } from './arquivo-por-ano'
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

  const { abertos, demais, totalPaginas, publicados, encerrados, proximo } =
    await consultarEditais(abaAtiva, paginaAtual)

  // `abertos` vem sempre preenchido para alimentar o expediente; a aba
  // Encerrados apenas não os lista.
  const emCartaz = abaAtiva === 'encerrados' ? [] : abertos

  const numeros: NumeroDestaque[] = [
    { valor: String(publicados), rotulo: 'Editais publicados' },
    {
      valor: String(abertos.length),
      rotulo: abertos.length === 1 ? 'Edital aberto agora' : 'Editais abertos agora',
    },
    { valor: String(encerrados), rotulo: encerrados === 1 ? 'Edital encerrado' : 'Editais encerrados' },
    {
      valor: proximo ? String(proximo.dias) : '—',
      rotulo: proximo ? 'Dias até o prazo mais próximo' : 'Nenhum prazo em aberto',
    },
  ]

  return (
    <div className="tema-secult font-questrial">
      <div id="capa">
        <FolhaDeRosto proximoEncerramento={proximo} />
      </div>

      <div id="expediente">
        <FaixaNumeros numeros={numeros} />
      </div>

      {emCartaz.length > 0 && (
        <FaixaSecao
          id="abertos"
          cartela={emCartaz.length === 1 ? 'Inscrição aberta' : 'Inscrições abertas'}
          cor="terracota"
        >
          <p className="max-w-2xl text-sm leading-relaxed text-papel-100/85">
            Editais recebendo propostas agora. Sem ordem de preferência entre eles.
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {emCartaz.map((edital) => (
              <DossieEdital key={edital.id} edital={edital} />
            ))}
          </ul>
        </FaixaSecao>
      )}

      <section className="papel-textura bg-papel-100">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <Cartela id="arquivo" cor="terracota">
            {abaAtiva === 'encerrados' ? 'Editais encerrados' : 'Arquivo de editais'}
          </Cartela>

          <div className="mt-8">
            <AbasStatus ativa={abaAtiva} />

            {demais.length > 0 && (
              <div className="pt-10">
                <ArquivoPorAno editais={demais} />

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
        </div>
      </section>
    </div>
  )
}
