import Link from 'next/link'
import type { InscricaoStatus } from '@prisma/client'
import {
  Badge,
  Card,
  EmptyState,
  IconCheck,
  IconClipboard,
  IconClose,
  Pagination,
} from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import type { AbaKey } from './constantes'

export interface InscricaoHabilitacao {
  id: string
  numero: string
  status: InscricaoStatus
  submittedAt: Date | null
  proponente: { nome: string; cpfCnpj: string | null }
  _count: { anexos: number }
}

interface Props {
  inscricoes: InscricaoHabilitacao[]
  abaAtiva: AbaKey
  /** Edital ainda na fase de habilitação. */
  ativo: boolean
  detalheHref: (inscricaoId: string) => string
  page: number
  totalPages: number
  baseUrl: string
}

const dataEnvio = (data: Date | null) =>
  data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'

/** Fila de inscrições da aba ativa: cards no mobile, tabela no desktop. */
export function ListaInscricoes({ inscricoes, abaAtiva, ativo, detalheHref, page, totalPages, baseUrl }: Props) {
  if (inscricoes.length === 0) {
    return (
      <Card padding="md">
        <EmptyState
          icon={
            abaAtiva === 'pendentes' ? (
              <IconClipboard className="h-8 w-8 text-slate-400" />
            ) : abaAtiva === 'habilitadas' ? (
              <IconCheck className="h-8 w-8 text-slate-400" />
            ) : (
              <IconClose className="h-8 w-8 text-slate-400" />
            )
          }
          title={
            abaAtiva === 'pendentes'
              ? ativo
                ? 'Nada para conferir no momento'
                : 'Sem inscrições pendentes'
              : abaAtiva === 'habilitadas'
              ? 'Nenhuma inscrição habilitada ainda'
              : 'Nenhuma inscrição inabilitada'
          }
          description={
            abaAtiva === 'pendentes'
              ? 'Quando novas inscrições forem enviadas e a fase estiver aberta, elas aparecerão aqui.'
              : 'Ajuste os filtros acima ou troque de aba para ver outras inscrições.'
          }
        />
      </Card>
    )
  }

  return (
    <>
      {/* Mobile: lista de cards */}
      <ul className="sm:hidden space-y-3" aria-label="Inscrições">
        {inscricoes.map((inscricao) => (
          <li key={inscricao.id}>
            <Link
              href={detalheHref(inscricao.id)}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {inscricao.proponente.nome}
                </p>
                <Badge variant={inscricaoStatusVariant[inscricao.status]}>
                  {inscricaoStatusLabel[inscricao.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">{inscricao.numero}</span>
                <div className="flex items-center gap-3">
                  <span>
                    {inscricao._count.anexos} {inscricao._count.anexos === 1 ? 'doc.' : 'docs.'}
                  </span>
                  <span>{dataEnvio(inscricao.submittedAt)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: tabela */}
      <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Número</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Proponente</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Docs.</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Enviada em</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody>
            {inscricoes.map((inscricao) => (
              <tr key={inscricao.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{inscricao.numero}</td>
                <td className="py-3.5 px-4">
                  <p className="font-medium text-slate-900">{inscricao.proponente.nome}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{inscricao.proponente.cpfCnpj}</p>
                </td>
                <td className="py-3.5 px-4 text-slate-700 tabular-nums">{inscricao._count.anexos}</td>
                <td className="py-3.5 px-4 text-slate-600">{dataEnvio(inscricao.submittedAt)}</td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    href={detalheHref(inscricao.id)}
                    className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-medium text-sm"
                  >
                    {abaAtiva === 'pendentes' ? 'Conferir documentos' : 'Ver detalhes'}
                    <span aria-hidden>→</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl={baseUrl}
        className="mt-5 sm:mt-6"
      />
    </>
  )
}
