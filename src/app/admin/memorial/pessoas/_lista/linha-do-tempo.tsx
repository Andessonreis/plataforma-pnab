import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { IconChevronRight } from '@/components/ui'
import { stripMarkdown } from '@/lib/utils/markdown-blocos'
import { StatusChip } from '@/app/admin/memorial/_ui'
import { agruparPorAno } from './agrupar-por-ano'

interface Evento {
  id: string
  titulo: string
  ano: number | null
  periodo: string | null
  descricao: string | null
  status: StatusConteudo
}

const resumo = (texto: string | null) => (texto ? stripMarkdown(texto, 140) : null)

/**
 * Os eventos como a equipe vai vê-los no site: uma linha vertical por ano.
 * O ano é o marco de leitura, por isso vem em tipografia de cartaz.
 */
export function LinhaDoTempo({ eventos }: { eventos: Evento[] }) {
  return (
    <ol className="relative">
      {agruparPorAno(eventos).map((grupo) => (
        <li key={grupo.ano ?? 'sem-ano'} className="relative grid grid-cols-[4.5rem_1fr] gap-x-3 sm:grid-cols-[7rem_1fr] sm:gap-x-6">
          <div className="pt-1 text-right">
            {grupo.ano === null ? (
              <span className="text-sm font-bold leading-tight text-accent-900">Sem ano</span>
            ) : (
              <span className="font-display text-3xl leading-none tracking-wide text-brand-700 sm:text-4xl">{grupo.ano}</span>
            )}
          </div>
          <div className="relative border-l-2 border-tinta-900/15 pb-6 pl-5 sm:pl-6">
            <span
              aria-hidden="true"
              className={`absolute -left-[9px] top-2 h-4 w-4 rounded-full ring-4 ring-papel-50 ${grupo.ano === null ? 'border-2 border-dashed border-accent-600 bg-white' : 'bg-brand-600'}`}
            />
            {grupo.ano === null && (
              <p className="mb-2 text-sm text-tinta-700">Sem ano o evento não entra na linha do tempo do site. Abra e informe o ano.</p>
            )}
            <ul className="space-y-2">
              {grupo.eventos.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/admin/memorial/pessoas/eventos/${e.id}`}
                    className="group flex min-h-[44px] items-start gap-3 rounded-lg border border-tinta-900/10 bg-white px-3 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-2 focus-visible:outline-accent-500 sm:px-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-tinta-900 group-hover:text-brand-800">{e.titulo}</span>
                        <StatusChip tipo="conteudo" status={e.status} />
                      </span>
                      {e.periodo && <span className="mt-0.5 block text-sm font-medium text-tinta-700">{e.periodo}</span>}
                      {resumo(e.descricao) && <span className="mt-1 block text-sm text-tinta-600">{resumo(e.descricao)}</span>}
                    </span>
                    <IconChevronRight className="mt-1 h-5 w-5 shrink-0 text-tinta-500 group-hover:text-brand-700" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  )
}
