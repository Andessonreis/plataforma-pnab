import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { Card, Pagination } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'
import { SeloStatus } from './selo-status'

export interface LinhaConteudo {
  id: string
  titulo: string
  detalhe?: string | null
  status?: StatusConteudo
  atualizadoEm?: Date
  href: string
}

interface ListaConteudoProps {
  linhas: LinhaConteudo[]
  vazio: string
  pagina: number
  totalPaginas: number
  /** URL atual com filtros, usada pela paginação. */
  baseUrl: string
}

/** Lista do painel: nome, etapa e data da última alteração, com link para editar. */
export function ListaConteudo({ linhas, vazio, pagina, totalPaginas, baseUrl }: ListaConteudoProps) {
  if (linhas.length === 0) {
    return (
      <Card padding="sm" className="sm:p-8">
        <p className="text-center text-sm text-slate-600">{vazio}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card padding="sm" className="overflow-hidden !p-0">
        <ul className="divide-y divide-slate-100">
          {linhas.map((l) => (
            <li key={l.id}>
              <Link
                href={l.href}
                className="flex min-h-[56px] flex-col gap-1 px-4 py-3 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-500 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{l.titulo}</span>
                  {l.detalhe && <span className="block truncate text-sm text-slate-500">{l.detalhe}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  {l.status && <SeloStatus status={l.status} />}
                  {l.atualizadoEm && <span>alterado em {formatDate(l.atualizadoEm)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Pagination currentPage={pagina} totalPages={totalPaginas} baseUrl={baseUrl} />
    </div>
  )
}
