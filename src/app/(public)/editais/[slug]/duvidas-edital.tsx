import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'

interface DuvidaEdital {
  id: string
  pergunta: string
  resposta: string
}

interface DuvidasEditalProps {
  duvidas: DuvidaEdital[]
}

/**
 * Dúvidas específicas deste edital.
 *
 * Mesmo tratamento da página de dúvidas: entradas abertas por `details`, que o
 * teclado, o leitor de tela e o Ctrl+F do navegador já sabem operar. Quem lê o
 * edital e quem lê o FAQ estão fazendo a mesma coisa, e não faz sentido que a
 * mesma pergunta se comporte de dois jeitos conforme a página.
 */
export function DuvidasEdital({ duvidas }: DuvidasEditalProps) {
  if (duvidas.length === 0) return null

  return (
    <>
      <div className="divide-y divide-tinta-900/15 border-y border-tinta-900/15">
        {duvidas.map((duvida) => (
          <details key={duvida.id} className="group py-1">
            <summary className="flex cursor-pointer list-none items-start gap-4 py-4 titulo text-lg leading-snug tracking-wide text-tinta-900 transition-colors marker:content-none hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500">
              <span
                className="mt-1 shrink-0 font-questrial text-xl leading-none text-accent-600 transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
              {duvida.pergunta}
            </summary>
            <p className="max-w-3xl whitespace-pre-line pb-5 pl-9 text-[0.9375rem] leading-relaxed text-tinta-700">
              {duvida.resposta}
            </p>
          </details>
        ))}
      </div>

      <Link
        href="/faq"
        className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
      >
        Ver todas as dúvidas do portal
        <IconArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </>
  )
}
