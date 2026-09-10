import Link from 'next/link'

/**
 * Abas de status com a contagem de cada fila embutida no rótulo.
 *
 * O número na aba é o que evita a ida e volta entre filas só pra descobrir se
 * sobrou trabalho. `alerta` realça a contagem quando aquela fila é a pendência
 * que o operador precisa zerar.
 */

export interface AbaStatus {
  chave: string
  label: string
  count: number
  href: string
  alerta?: boolean
}

interface Props {
  abas: readonly AbaStatus[]
  ativa: string
  /** Descreve o critério para leitor de tela, ex.: "Filtrar por status de habilitação". */
  rotulo: string
  className?: string
}

export function AbasStatus({ abas, ativa, rotulo, className = 'mb-5 sm:mb-6' }: Props) {
  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <nav className="flex flex-wrap gap-x-1 -mb-px" aria-label={rotulo}>
        {abas.map((aba) => {
          const selecionada = aba.chave === ativa
          return (
            <Link
              key={aba.chave}
              href={aba.href}
              aria-current={selecionada ? 'page' : undefined}
              className={[
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px]',
                selecionada
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300',
              ].join(' ')}
            >
              <span>{aba.label}</span>
              <span
                className={[
                  'inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-semibold tabular-nums',
                  selecionada
                    ? aba.alerta && aba.count > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-brand-100 text-brand-800'
                    : 'bg-slate-100 text-slate-600',
                ].join(' ')}
              >
                {aba.count}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
