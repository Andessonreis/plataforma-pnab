import Link from 'next/link'
import { colunasDosSnapshots, valorDaColuna } from '@/lib/forms'
import { formatDateTime } from '@/lib/utils/format'
import { dadosDe, snapshotDe, type Resposta } from './tipos'

const MOSTRAR = 3

/** Uma resposta no celular: as primeiras perguntas e o atalho para ver tudo. */
export function RespostaCartao({ resposta, href }: { resposta: Resposta; href: string }) {
  const dados = dadosDe(resposta)
  const colunas = colunasDosSnapshots([snapshotDe(resposta)])

  return (
    <article className="rounded-xl border border-tinta-900/10 bg-white p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-bold tabular-nums text-tinta-900">{resposta.protocolo}</h2>
        <p className="text-sm text-tinta-600">{formatDateTime(resposta.createdAt)}</p>
      </header>
      {(resposta.nome || resposta.email) && <p className="mt-1 text-sm text-tinta-700">{[resposta.nome, resposta.email].filter(Boolean).join(', ')}</p>}
      <dl className="mt-3 space-y-2 border-t border-tinta-900/10 pt-3 text-sm">
        {colunas.slice(0, MOSTRAR).map((c) => (
          <div key={c.chave}>
            <dt className="text-tinta-600">{c.rotulo}</dt>
            <dd className="line-clamp-3 whitespace-pre-line break-words font-medium text-tinta-900">{valorDaColuna(dados, c.chave) || 'Sem resposta'}</dd>
          </div>
        ))}
      </dl>
      <Link href={href} className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
        Ver resposta completa{colunas.length > MOSTRAR ? ` (${colunas.length} perguntas)` : ''}
      </Link>
    </article>
  )
}
