import type { Metadata } from 'next'
import { Card, EmptyState, FadeIn, IconUsers, Pagination } from '@/components/ui'
import { requireRole } from '../require-role'
import { filtrosAgentesSchema, queryParaFiltros } from '@/lib/agentes/filtros'
import { listarAgentesPaginado } from '@/lib/services/agentes.service'
import { FiltrosAgentesForm } from './filtros-agentes'
import { ExportarAgentes } from './exportar-agentes'
import { TabelaAgentes } from './tabela-agentes'

export const metadata: Metadata = {
  title: 'Agentes Culturais — Portal PNAB Irecê',
}

const PAGE_SIZE = 25

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Query dos filtros, sem paginação — é o que a exportação reaproveita. */
function queryDosFiltros(params: URLSearchParams): string {
  const filtros = new URLSearchParams(params)
  filtros.delete('page')
  return filtros.toString()
}

export default async function AdminAgentesPage({ searchParams }: Props) {
  await requireRole('ADMIN')

  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(valor) ? valor : [valor ?? '']) {
      if (item) params.append(chave, item)
    }
  }

  // Filtro inválido na URL não pode derrubar a tela: cai no recorte padrão.
  const parsed = filtrosAgentesSchema.safeParse(queryParaFiltros(params))
  const filtros = parsed.success ? parsed.data : filtrosAgentesSchema.parse({})

  const page = Math.max(1, Number(params.get('page')) || 1)
  const { agentes, total, totalPages } = await listarAgentesPaginado(filtros, page, PAGE_SIZE)

  const queryFiltros = queryDosFiltros(params)
  const baseUrl = `/admin/agentes${queryFiltros ? `?${queryFiltros}` : ''}`

  return (
    <section>
      <FadeIn>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Agentes Culturais</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
            {total} cadastro(s) no recorte atual
            {parsed.success ? '' : ' — filtro inválido na URL, exibindo o padrão'}
          </p>
        </div>
      </FadeIn>

      <FiltrosAgentesForm filtros={filtros} />
      <ExportarAgentes queryFiltros={queryFiltros} total={total} />

      {agentes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconUsers className="h-8 w-8 text-slate-400" />}
            title="Nenhum cadastro encontrado"
            description="Ajuste os filtros."
          />
        </Card>
      ) : (
        <>
          <TabelaAgentes agentes={agentes} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={baseUrl}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
