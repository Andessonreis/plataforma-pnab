import { colunasDosSnapshots, valorDaColuna } from '@/lib/forms'
import { formatDateTime } from '@/lib/utils/format'
import { dadosDe, snapshotDe, type Resposta } from './tipos'

/** Uma resposta no celular, com os rótulos do snapshot dela. */
export function RespostaCartao({ resposta }: { resposta: Resposta }) {
  const dados = dadosDe(resposta)
  const colunas = colunasDosSnapshots([snapshotDe(resposta)])

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
        <h2 className="font-mono text-sm font-semibold text-slate-900">{resposta.protocolo}</h2>
        <p className="text-xs text-slate-500">
          {formatDateTime(resposta.createdAt)}, versão {resposta.versao}
        </p>
      </header>
      {(resposta.nome || resposta.email) && (
        <p className="mt-2 text-xs text-slate-600">{[resposta.nome, resposta.email].filter(Boolean).join(', ')}</p>
      )}
      <dl className="mt-3 space-y-2 text-sm">
        {colunas.map((c) => (
          <div key={c.chave}>
            <dt className="text-xs font-medium text-slate-500">{c.rotulo}</dt>
            <dd className="whitespace-pre-line break-words text-slate-900">{valorDaColuna(dados, c.chave) || '—'}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
