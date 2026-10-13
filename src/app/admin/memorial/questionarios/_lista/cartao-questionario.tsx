import Link from 'next/link'
import { formatDate } from '@/lib/utils/format'
import { StatusChip, botaoNeutro, botaoPrimario } from '@/app/admin/memorial/_ui'
import { descreverFinalidade } from '../finalidades'
import type { QuestionarioDaLista } from './carregar-lista'

const BASE = '/admin/memorial/questionarios'
const MOSTRAR = 3

function Respostas({ total, ultima }: { total: number; ultima: Date | null }) {
  if (total === 0) return <p className="text-sm text-tinta-600">Nenhuma resposta ainda</p>
  return (
    <p className="text-sm text-tinta-700">
      <strong className="text-lg font-bold tabular-nums text-tinta-900">{total}</strong> {total === 1 ? 'resposta' : 'respostas'}
      {ultima && <span className="text-tinta-600">, a última em {formatDate(ultima)}</span>}
    </p>
  )
}

/** Um questionário: para que serve, as primeiras perguntas e quantas respostas já chegaram. */
export function CartaoQuestionario({ q }: { q: QuestionarioDaLista }) {
  const finalidade = descreverFinalidade(q.finalidade)
  const restantes = q.perguntas.length - MOSTRAR

  return (
    <article className="flex h-full flex-col rounded-xl border border-tinta-900/10 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-brand-700">{finalidade.rotulo}</p>
        <StatusChip tipo="conteudo" status={q.status} />
      </div>
      <h2 className="mt-1 text-lg font-bold leading-snug text-tinta-900">
        <Link href={`${BASE}/${q.id}`} className="hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-accent-500">
          {q.titulo}
        </Link>
      </h2>
      {q.descricao && <p className="mt-1 line-clamp-2 text-sm text-tinta-600">{q.descricao}</p>}

      <div className="mt-4 rounded-lg bg-papel-50 px-3 py-2.5">
        <p className="text-xs font-semibold text-tinta-700">{q.perguntas.length === 1 ? '1 pergunta' : `${q.perguntas.length} perguntas`}</p>
        <ol className="mt-1 list-inside list-decimal space-y-0.5 text-sm text-tinta-800 marker:text-tinta-500">
          {q.perguntas.slice(0, MOSTRAR).map((p, i) => (
            <li key={i} className="truncate">{p || 'Pergunta sem texto'}</li>
          ))}
        </ol>
        {restantes > 0 && <p className="mt-0.5 text-sm text-tinta-600">e mais {restantes}</p>}
      </div>

      <div className="mt-auto pt-4">
        <Respostas total={q._count.respostas} ultima={q.ultimaResposta} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={`${BASE}/${q.id}/respostas`} className={botaoNeutro}>Ver respostas</Link>
          <Link href={`${BASE}/${q.id}`} className={botaoPrimario}>Editar</Link>
        </div>
      </div>
    </article>
  )
}
