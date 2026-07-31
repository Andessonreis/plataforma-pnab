import type { Metadata } from 'next'
import type { EditalStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { EmptyState, Pagination } from '@/components/ui'
import { IconDocument } from '@/components/ui/icons'
import { getStatusDisplay, OPEN_STATUSES, CLOSED_STATUSES } from '@/lib/utils/edital-status'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getNextDeadline } from '@/lib/utils/cronograma'
import { AbasStatus, ABAS, type ChaveAba } from './abas-status'
import { FolhaDeRosto } from './folha-de-rosto'
import { LinhaEdital, type EditalListado } from './linha-edital'

export const metadata: Metadata = {
  title: 'Editais',
  description: 'Consulte os editais de fomento à cultura da PNAB em Irecê/BA.',
}

interface SearchParams {
  status?: string
  page?: string
}

const PAGE_SIZE = 9

/** `undefined` deixa o filtro de fora e traz tudo que não é rascunho. */
function statusDaAba(aba: ChaveAba): EditalStatus[] | undefined {
  if (aba === 'abertos') return OPEN_STATUSES
  if (aba === 'encerrados') return CLOSED_STATUSES
  return undefined
}

/** Corta no último espaço para não terminar no meio de uma palavra. */
function resumir(texto: string, limite: number): string {
  if (texto.length <= limite) return texto
  const corte = texto.slice(0, limite)
  const ultimoEspaco = corte.lastIndexOf(' ')
  return (ultimoEspaco > 0 ? corte.slice(0, ultimoEspaco) : corte) + '...'
}

function urlDaAba(aba: ChaveAba): string {
  return aba === 'todos' ? '/editais' : `/editais?status=${aba}`
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
  const filtro = statusDaAba(abaAtiva)
  const where = {
    status: filtro ? { in: filtro } : { not: 'RASCUNHO' as EditalStatus },
  }

  const [editais, total, publicados, abertos] = await Promise.all([
    prisma.edital.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip: (paginaAtual - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.edital.count({ where }),
    prisma.edital.count({ where: { status: { not: 'RASCUNHO' as EditalStatus } } }),
    prisma.edital.count({ where: { status: { in: OPEN_STATUSES } } }),
  ])

  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const listados: EditalListado[] = editais.map((edital, i) => {
    const display = getStatusDisplay(edital.status)
    const prazo = getNextDeadline(edital.cronograma)
    return {
      id: edital.id,
      slug: edital.slug,
      ordinal: (paginaAtual - 1) * PAGE_SIZE + i + 1,
      titulo: edital.titulo,
      resumo: edital.resumo ? resumir(edital.resumo, 190) : null,
      categorias: edital.categorias.slice(0, 3),
      status: edital.status,
      statusLabel: display.label,
      encerrado: CLOSED_STATUSES.includes(edital.status),
      prazoRotulo: prazo?.label ?? null,
      prazoData: prazo ? formatDate(prazo.dataHora) : null,
      valor: edital.valorTotal ? formatCurrency(edital.valorTotal) : null,
    }
  })

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto total={publicados} abertos={abertos} />

      <section className="bg-papel-50 papel-textura pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AbasStatus ativa={abaAtiva} totalVisivel={total} />

          {listados.length > 0 ? (
            <>
              <ul className="divide-y divide-tinta-900/10">
                {listados.map((edital) => (
                  <LinhaEdital key={edital.id} edital={edital} />
                ))}
              </ul>

              {totalPaginas > 1 && (
                <Pagination
                  currentPage={paginaAtual}
                  totalPages={totalPaginas}
                  baseUrl={urlDaAba(abaAtiva)}
                  className="mt-10"
                />
              )}
            </>
          ) : (
            <div className="py-16">
              <EmptyState
                icon={<IconDocument className="h-8 w-8 text-tinta-400" />}
                title="Nenhum edital nesta pilha"
                description={
                  abaAtiva === 'abertos'
                    ? 'Não há editais com inscrições abertas neste momento. Os próximos serão anunciados aqui e nos canais da Secretaria.'
                    : abaAtiva === 'encerrados'
                      ? 'Ainda não há editais encerrados para consulta.'
                      : 'Nenhum edital publicado até agora.'
                }
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
