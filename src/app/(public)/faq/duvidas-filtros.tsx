import type { CadernoDeDuvidas } from './consulta'

export const TODOS_CADERNOS = 'todos'

interface DuvidasFiltrosProps {
  /** Só cadernos de edital - o geral não entra no filtro, é sempre visível. */
  cadernos: CadernoDeDuvidas[]
  ativo: string
  aoEscolher: (chave: string) => void
}

/**
 * Filtro por edital em chips horizontais.
 *
 * Substitui o índice lateral que só existia em `lg:`: em telas estreitas é
 * uma faixa de altura fixa que rola na horizontal, em vez de uma lista
 * vertical que cresce com o número de editais e empurra a busca para baixo.
 * A partir de `sm:`, quebra linha em vez de rolar.
 *
 * São `<button aria-pressed>`, não links de âncora - o filtro é estado de UI
 * combinado com a busca, sem URL própria por chip.
 */
export function DuvidasFiltros({ cadernos, ativo, aoEscolher }: DuvidasFiltrosProps) {
  const total = cadernos.reduce((soma, c) => soma + c.duvidas.length, 0)

  return (
    <div
      role="group"
      aria-label="Filtrar dúvidas por edital"
      className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:snap-none"
    >
      <Chip
        label="Todos"
        contagem={total}
        ativo={ativo === TODOS_CADERNOS}
        onClick={() => aoEscolher(TODOS_CADERNOS)}
      />
      {cadernos.map((caderno) => (
        <Chip
          key={caderno.id}
          label={caderno.titulo}
          contagem={caderno.duvidas.length}
          ativo={ativo === caderno.id}
          onClick={() => aoEscolher(caderno.id)}
        />
      ))}
    </div>
  )
}

interface ChipProps {
  label: string
  contagem: number
  ativo: boolean
  onClick: () => void
}

function Chip({ label, contagem, ativo, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 whitespace-nowrap border-2 px-4 text-xs font-bold uppercase tracking-[0.12em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 ${
        ativo
          ? 'border-tinta-900 bg-tinta-900 text-papel-50'
          : 'border-tinta-900/20 bg-papel-50 text-tinta-600 hover:border-tinta-900/40 hover:text-tinta-900'
      }`}
    >
      {label}
      <span className={`tabular-nums ${ativo ? 'text-papel-200' : 'text-tinta-400'}`}>
        {contagem}
      </span>
    </button>
  )
}
