import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'
import type { CadernoDeDuvidas } from './consulta'
import { DuvidaItem } from './duvida-item'

interface CadernoSecaoProps {
  caderno: CadernoDeDuvidas
  abertoPorPadrao: boolean
}

/**
 * Um bloco de dúvidas de um edital específico, dentro da camada "por
 * edital" (`#faq-cadernos`). Título em `h3`: a seção-mãe já tem seu próprio
 * `h2`, então cada caderno é subseção dela.
 */
export function CadernoSecao({ caderno, abertoPorPadrao }: CadernoSecaoProps) {
  return (
    <div id={caderno.id} className="scroll-mt-32">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-tinta-900 pb-3">
        <h3 className="titulo text-2xl leading-tight tracking-wide text-tinta-900">
          {caderno.titulo}
        </h3>
        {caderno.editalSlug && (
          <Link
            href={`/editais/${caderno.editalSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline"
          >
            Ver edital
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-tinta-900/15">
        {caderno.duvidas.map((duvida) => (
          <DuvidaItem key={duvida.id} duvida={duvida} abertoPorPadrao={abertoPorPadrao} />
        ))}
      </div>
    </div>
  )
}
