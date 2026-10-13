import Link from 'next/link'
import { IconPlus } from '@/components/ui'
import { MODELOS } from '../modelos'

/** Atalhos para começar com perguntas já escritas; abrem o formulário de novo questionário preenchido. */
export function ModelosPartida() {
  return (
    <section aria-labelledby="modelos-titulo" className="mb-6">
      <h2 id="modelos-titulo" className="mb-2 text-sm font-semibold text-tinta-800">Ou comece de um modelo pronto</h2>
      <ul className="grid gap-2 md:grid-cols-2">
        {MODELOS.map((m) => (
          <li key={m.chave}>
            <Link
              href={`/admin/memorial/questionarios/novo?modelo=${m.chave}`}
              className="group flex h-full min-h-[44px] items-start gap-3 rounded-xl border border-dashed border-brand-300 bg-white p-3 hover:border-solid hover:bg-brand-50/50 focus-visible:outline-2 focus-visible:outline-accent-500 sm:p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 group-hover:bg-brand-100">
                <IconPlus className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-tinta-900">{m.titulo}</span>
                <span className="mt-0.5 block text-sm text-tinta-600">{m.resumo}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
