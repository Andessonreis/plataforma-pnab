import { Card, Button } from '@/components/ui'
import { labelArea, SEM_AREA } from '@/lib/inscricoes/area-filter'

interface FiltrosInscricoesProps {
  searchQuery?: string
  editalIdFilter?: string
  statusFilter?: string
  areaFilter?: string
  editais: { id: string; titulo: string; ano: number }[]
  areas: { nome: string; total: number }[]
}

/** Status virou aba (StatusTabs), no mesmo padrão do painel Gestão de Editais — aqui sobra busca, edital e área, os campos que fazem sentido num form de texto/seleção. */
export function FiltrosInscricoes({ searchQuery, editalIdFilter, statusFilter, areaFilter, editais, areas }: FiltrosInscricoesProps) {
  return (
    <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
      <form method="get" action="/admin/inscricoes" className="space-y-4">
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-tinta-800 mb-1.5">
              Buscar
            </label>
            <input
              id="search"
              name="search"
              type="text"
              defaultValue={searchQuery}
              placeholder="Nome, CPF ou número..."
              className="block w-full rounded-lg border border-papel-300 px-3 py-2.5 text-sm text-tinta-950 placeholder:text-tinta-700/40 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="editalId" className="block text-sm font-medium text-tinta-800 mb-1.5">
              Edital
            </label>
            <select
              id="editalId"
              name="editalId"
              defaultValue={editalIdFilter}
              className="block w-full rounded-lg border border-papel-300 px-3 py-2.5 text-sm text-tinta-950 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            >
              <option value="">Todos os editais</option>
              {editais.map((edital) => (
                <option key={edital.id} value={edital.id}>
                  {edital.titulo} ({edital.ano})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-tinta-800 mb-1.5">
              Área
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue={areaFilter}
              className="block w-full rounded-lg border border-papel-300 px-3 py-2.5 text-sm text-tinta-950 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 min-h-[44px]"
            >
              <option value="">Todas as áreas</option>
              {areas.map((a) => (
                <option key={a.nome || SEM_AREA} value={a.nome || SEM_AREA}>
                  {labelArea(a.nome)} ({a.total})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit">Filtrar</Button>
          <Button href={statusFilter ? `/admin/inscricoes?status=${statusFilter}` : '/admin/inscricoes'} variant="ghost">
            Limpar
          </Button>
        </div>
      </form>
    </Card>
  )
}
