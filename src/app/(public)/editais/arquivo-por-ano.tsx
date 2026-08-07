import { DossieEdital } from './dossie-edital'
import type { EditalListado } from './tipos'

interface ArquivoPorAnoProps {
  editais: EditalListado[]
}

/**
 * Agrupa a página corrente do arquivo por ano do edital, do mais recente ao
 * mais antigo.
 *
 * A ordem de cada grupo já vem certa do banco (`createdAt desc`); o
 * agrupamento aqui é só visual, sobre a página já paginada pelo backend — não
 * dispara consulta nova nem reordena o que veio da API.
 */
export function ArquivoPorAno({ editais }: ArquivoPorAnoProps) {
  const porAno = new Map<number, EditalListado[]>()
  for (const edital of editais) {
    const grupo = porAno.get(edital.ano)
    if (grupo) grupo.push(edital)
    else porAno.set(edital.ano, [edital])
  }

  const anos = [...porAno.keys()].sort((a, b) => b - a)

  return (
    <div className="space-y-12">
      {anos.map((ano, indice) => (
        <div
          key={ano}
          className={indice > 0 ? 'border-t-2 border-dashed border-tinta-900/15 pt-10' : ''}
        >
          <h3 className="titulo text-2xl tracking-wide text-tinta-900">{ano}</h3>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {porAno.get(ano)!.map((edital) => (
              <DossieEdital key={edital.id} edital={edital} mostrarAno />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
