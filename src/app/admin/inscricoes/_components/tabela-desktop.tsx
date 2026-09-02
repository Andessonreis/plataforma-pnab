import { Fragment } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { InscricaoStatus } from '@prisma/client'
import type { InscricaoListItem } from './types'

interface TabelaDesktopProps {
  inscricoes: InscricaoListItem[]
  isAvaliador: boolean
  linkColor: string
}

/** Cabeçalho de grupo — a lista vem ordenada por edital, então isto substitui
 * a coluna "Edital" repetida em toda linha (ilegível com dezenas de editais). */
function CabecalhoGrupo({ titulo, colSpan }: { titulo: string; colSpan: number }) {
  return (
    <tr className="bg-papel-100/70">
      <td colSpan={colSpan} className="py-2 px-4 text-xs font-semibold uppercase tracking-wide text-tinta-700">
        {titulo}
      </td>
    </tr>
  )
}

export function TabelaDesktop({ inscricoes, isAvaliador, linkColor }: TabelaDesktopProps) {
  let editalAnterior: string | null = null
  const colSpan = isAvaliador ? 6 : 7

  return (
    <Card padding="sm" className="overflow-hidden hidden sm:block">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-papel-50">
              <th className="text-left py-3 px-4 font-medium text-tinta-700/70">Número</th>
              <th className="text-left py-3 px-4 font-medium text-tinta-700/70">Proponente</th>
              <th className="text-left py-3 px-4 font-medium text-tinta-700/70">Categoria</th>
              {isAvaliador ? (
                <th className="text-left py-3 px-4 font-medium text-tinta-700/70">Avaliação</th>
              ) : (
                <>
                  <th className="text-left py-3 px-4 font-medium text-tinta-700/70">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-tinta-700/70">Avaliadores</th>
                </>
              )}
              <th className="text-left py-3 px-4 font-medium text-tinta-700/70">Enviada em</th>
              <th className="text-right py-3 px-4 font-medium text-tinta-700/70">Ações</th>
            </tr>
          </thead>
          <tbody>
            {inscricoes.map((inscricao) => {
              const minhaAvaliacao = inscricao.avaliacoes?.[0]
              const novoGrupo = inscricao.edital.titulo !== editalAnterior
              editalAnterior = inscricao.edital.titulo

              return (
                <Fragment key={inscricao.id}>
                  {novoGrupo && <CabecalhoGrupo titulo={inscricao.edital.titulo} colSpan={colSpan} />}
                  <tr className="border-t border-papel-100 hover:bg-papel-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{inscricao.numero}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-tinta-950">{inscricao.proponente.nome}</p>
                        <p className="text-xs text-tinta-700/50">{inscricao.proponente.cpfCnpj ?? '—'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-tinta-700">{inscricao.categoria ?? '—'}</td>
                    {isAvaliador ? (
                      <td className="py-3 px-4">
                        {minhaAvaliacao ? (
                          <span className={[
                            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                            minhaAvaliacao.finalizada ? 'text-emerald-700 bg-emerald-50' : 'text-accent-800 bg-accent-50',
                          ].join(' ')}>
                            {minhaAvaliacao.finalizada ? (
                              <>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {parseFloat(String(minhaAvaliacao.notaTotal)).toFixed(1)}
                              </>
                            ) : 'Rascunho'}
                          </span>
                        ) : (
                          <span className="text-xs text-tinta-700/40">Pendente</span>
                        )}
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          <Badge variant={inscricaoStatusVariant[inscricao.status as InscricaoStatus]}>
                            {inscricaoStatusLabel[inscricao.status as InscricaoStatus]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {(inscricao._count?.avaliacoes ?? 0) > 0 ? (
                            <span className="inline-flex items-center justify-center text-xs font-medium bg-brand-50 text-brand-700 rounded-full px-2 py-0.5 min-w-[24px]">
                              {inscricao._count?.avaliacoes}
                            </span>
                          ) : (
                            <span className="text-xs text-tinta-700/40">—</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-tinta-700/60">
                      {inscricao.submittedAt
                        ? new Date(inscricao.submittedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/inscricoes/${inscricao.id}`} className={`${linkColor} font-medium text-xs`}>
                        {isAvaliador ? 'Avaliar' : 'Detalhes'}
                      </Link>
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
