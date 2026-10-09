import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { ROTULO_STATUS, STATUS_CONTEUDO } from '@/lib/memorial/rotulos'
import type { contarConteudo } from '@/lib/services/memorial-painel.service'

type Contagens = Awaited<ReturnType<typeof contarConteudo>>

const GRUPOS = [
  { chave: 'exposicoes', rotulo: 'Exposições', href: '/admin/memorial/exposicoes' },
  { chave: 'acervo', rotulo: 'Acervo e fotografias', href: '/admin/memorial/acervo' },
  { chave: 'pessoas', rotulo: 'Pessoas', href: '/admin/memorial/pessoas' },
  { chave: 'eventos', rotulo: 'Eventos', href: '/admin/memorial/pessoas?aba=eventos' },
] as const

/** Quanto há de cada conteúdo e em que etapa: o que está esperando revisão salta à vista. */
export function ContagensConteudo({ contagens }: { contagens: Contagens }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {GRUPOS.map((g) => {
        const porStatus = contagens[g.chave]
        const total = STATUS_CONTEUDO.reduce((soma, s) => soma + (porStatus[s] ?? 0), 0)
        const emRevisao = porStatus.EM_REVISAO ?? 0
        return (
          <li key={g.chave}>
            <Link
              href={g.href}
              className="block h-full rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <p className="text-sm font-medium text-slate-600">{g.rotulo}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{total}</p>
              <p className="mt-2 text-xs text-slate-600">
                {(['PUBLICADO', 'APROVADO', 'RASCUNHO'] as StatusConteudo[])
                  .map((s) => `${porStatus[s] ?? 0} ${ROTULO_STATUS[s].toLowerCase()}`)
                  .join(' · ')}
              </p>
              {emRevisao > 0 && (
                <p className="mt-2 text-xs font-semibold text-amber-800">
                  {emRevisao} aguardando revisão
                </p>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
