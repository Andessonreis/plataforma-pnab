import Link from 'next/link'
import { IconChevronRight } from '@/components/ui'

export interface Tarefa {
  texto: string
  href: string
  acao: string
}

/** Pendências de conteúdo: frase do que está parado e o link que resolve. */
export function VisaoTarefas({ tarefas }: { tarefas: Tarefa[] }) {
  return (
    <ul className="divide-y divide-tinta-900/10 border-t border-tinta-900/10 bg-papel-50/50">
      {tarefas.map((t) => (
        <li key={t.href}>
          <Link
            href={t.href}
            className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-papel-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500"
          >
            <span className="text-tinta-900">{t.texto}</span>
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700">
              {t.acao}
              <IconChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
