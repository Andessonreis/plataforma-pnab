import { Fragment } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import type { InscricaoListItem } from './types'

interface ListaMobileProps {
  inscricoes: InscricaoListItem[]
  isAvaliador: boolean
}

export function ListaMobile({ inscricoes, isAvaliador }: ListaMobileProps) {
  let editalAnterior: string | null = null

  return (
    <div className="sm:hidden space-y-3">
      {inscricoes.map((inscricao) => {
        const minhaAval = inscricao.avaliacoes?.[0]
        const novoGrupo = inscricao.edital.titulo !== editalAnterior
        editalAnterior = inscricao.edital.titulo

        return (
          <Fragment key={inscricao.id}>
            {novoGrupo && (
              <p className="pt-2 first:pt-0 px-1 text-xs font-semibold uppercase tracking-wide text-tinta-700/70">
                {inscricao.edital.titulo}
              </p>
            )}
            <Link
              href={`/admin/inscricoes/${inscricao.id}`}
              className="block overflow-hidden rounded-lg border border-papel-200 bg-white p-3.5 hover:bg-papel-50 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-medium text-tinta-950 leading-snug">{inscricao.proponente.nome}</p>
                {isAvaliador && minhaAval ? (
                  <span className={[
                    'shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full',
                    minhaAval.finalizada ? 'text-emerald-700 bg-emerald-50' : 'text-accent-800 bg-accent-50',
                  ].join(' ')}>
                    {minhaAval.finalizada ? `✓ ${parseFloat(String(minhaAval.notaTotal)).toFixed(1)}` : 'Rascunho'}
                  </span>
                ) : !isAvaliador ? (
                  <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                    {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                  </Badge>
                ) : (
                  <span className="text-[11px] text-tinta-700/40 shrink-0">Pendente</span>
                )}
              </div>
              {inscricao.categoria && (
                <p className="text-xs text-tinta-700/60 leading-snug mb-2">{inscricao.categoria}</p>
              )}
              <div className="flex items-center justify-between text-[11px] text-tinta-700/50">
                <span className="font-mono">{inscricao.numero}</span>
                <div className="flex items-center gap-2">
                  {!isAvaliador && (inscricao._count?.avaliacoes ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-brand-700">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {inscricao._count?.avaliacoes}
                    </span>
                  )}
                  <span>
                    {inscricao.submittedAt
                      ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                      : '—'}
                  </span>
                </div>
              </div>
            </Link>
          </Fragment>
        )
      })}
    </div>
  )
}
