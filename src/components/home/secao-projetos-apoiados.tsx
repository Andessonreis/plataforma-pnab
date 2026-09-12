import Link from 'next/link'
import { Carimbo } from '@/components/ui/carimbo'
import { IconArrowRight } from '@/components/ui/icons'
import type { ProjetoApoiadoResumo } from './types'

interface SecaoProjetosApoiadosProps {
  projetos: ProjetoApoiadoResumo[]
}

/**
 * Fomento como lançamento de livro-caixa — o mesmo desenho de `/projetos-apoiados`
 * (valor grande à esquerda, fio vertical, carimbo de situação), não um cartão
 * de SaaS. Reusar essa estrutura em vez de inventar um cartão novo evita mais
 * um retângulo com borda arredondada na página.
 * Sem projeto publicado ainda, some sozinha (mesmo critério de `SecaoDiaADia`).
 */
export function SecaoProjetosApoiados({ projetos }: SecaoProjetosApoiadosProps) {
  if (projetos.length === 0) return null

  return (
    <section className="bg-papel-50 py-10 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-tinta-900 pb-4">
          <h2 className="titulo text-2xl leading-tight tracking-wide text-tinta-900 sm:text-3xl">
            Fomento que virou cultura em movimento
          </h2>
          <Link
            href="/projetos-apoiados"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-brand-700 underline decoration-2 underline-offset-4 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            Ver todos
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ul className="divide-y divide-tinta-900/15">
          {projetos.map((projeto) => (
            <li
              key={projeto.id}
              className="grid grid-cols-1 gap-x-6 gap-y-2 py-5 sm:grid-cols-[9rem_1fr] sm:items-start"
            >
              <p className="titulo text-2xl leading-none text-brand-700">{projeto.valor}</p>

              <div className="min-w-0 sm:border-l sm:border-tinta-900/15 sm:pl-6">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <h3 className="min-w-0 titulo text-lg leading-snug tracking-wide text-tinta-900">
                    {projeto.nome}
                  </h3>
                  <Carimbo tom={projeto.situacao.tom}>{projeto.situacao.label}</Carimbo>
                </div>
                {projeto.categoria && (
                  <p className="mt-1 text-sm text-tinta-600">{projeto.categoria}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
