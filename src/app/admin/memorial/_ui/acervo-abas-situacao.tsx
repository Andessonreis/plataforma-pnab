import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { montarUrl } from '../_componentes/parametros'

/** Abas por tarefa: o nome diz o que a equipe faz ali, não o nome técnico da etapa. */
const ABAS: { status?: StatusConteudo; rotulo: string }[] = [
  { rotulo: 'Todas' },
  { status: 'RASCUNHO', rotulo: 'Para completar' },
  { status: 'EM_REVISAO', rotulo: 'Em revisão' },
  { status: 'APROVADO', rotulo: 'Aprovadas' },
  { status: 'PUBLICADO', rotulo: 'No ar' },
  { status: 'ARQUIVADO', rotulo: 'Arquivadas' },
]

interface Props {
  /** Caminho da lista com os demais filtros já aplicados (busca, tipo...). */
  base: string
  status?: StatusConteudo
  contagens: Partial<Record<StatusConteudo, number>>
}

export function AcervoAbasSituacao({ base, status, contagens }: Props) {
  const total = Object.values(contagens).reduce((soma, n) => soma + (n ?? 0), 0)
  const visiveis = ABAS.filter((a) => a.status !== 'ARQUIVADO' || (contagens.ARQUIVADO ?? 0) > 0 || status === 'ARQUIVADO')

  return (
    <nav aria-label="Filtrar por situação" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-tinta-900/10">
        {visiveis.map((a) => {
          const ativo = a.status === status
          const n = a.status ? (contagens[a.status] ?? 0) : total
          return (
            <li key={a.rotulo}>
              <Link
                href={montarUrl(base, { status: a.status, page: undefined })}
                aria-current={ativo ? 'page' : undefined}
                className={`-mb-px inline-flex min-h-[44px] items-center gap-2 border-b-[3px] px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent-500 ${
                  ativo ? 'border-accent-500 text-tinta-900' : 'border-transparent text-tinta-600 hover:text-tinta-900'
                }`}
              >
                {a.rotulo}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                    ativo ? 'bg-accent-200 text-accent-900' : 'bg-tinta-900/[0.06] text-tinta-700'
                  }`}
                >
                  {n}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
