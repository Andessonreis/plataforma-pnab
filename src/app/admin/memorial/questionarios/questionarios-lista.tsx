import Link from 'next/link'
import { Badge, Card } from '@/components/ui'
import { ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { formatDate } from '@/lib/utils/format'
import type { listarQuestionarios } from '@/lib/services/questionario.service'
import { VARIANTE_STATUS } from './status'

type Questionario = Awaited<ReturnType<typeof listarQuestionarios>>['data'][number]

const BASE = '/admin/memorial/questionarios'

function Respostas({ q }: { q: Questionario }) {
  const total = q._count.respostas
  return (
    <Link href={`${BASE}/${q.id}/respostas`} className="font-medium text-brand-700 underline-offset-2 hover:underline">
      {total === 1 ? '1 resposta' : `${total} respostas`}
    </Link>
  )
}

/** Cards no celular, tabela a partir de 640px. */
export function QuestionariosLista({ questionarios }: { questionarios: Questionario[] }) {
  return (
    <>
      <ul className="space-y-3 sm:hidden">
        {questionarios.map((q) => (
          <li key={q.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <Link href={`${BASE}/${q.id}`} className="min-w-0 text-sm font-semibold leading-snug text-slate-900 hover:text-brand-700">
                {q.titulo}
              </Link>
              <Badge variant={VARIANTE_STATUS[q.status]}>{ROTULO_STATUS[q.status]}</Badge>
            </div>
            <p className="mt-1 truncate font-mono text-xs text-slate-500">/questionarios/{q.slug}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>Versão {q.versao}, {q.finalidade}</span>
              <Respostas q={q} />
            </div>
          </li>
        ))}
      </ul>

      <Card padding="sm" className="hidden overflow-hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">Questionário</th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">Finalidade</th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">Situação</th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">Versão</th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">Respostas</th>
                <th scope="col" className="px-4 py-3 font-medium text-slate-600">Alterado em</th>
              </tr>
            </thead>
            <tbody>
              {questionarios.map((q) => (
                <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`${BASE}/${q.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                      {q.titulo}
                    </Link>
                    <p className="font-mono text-xs text-slate-500">/questionarios/{q.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{q.finalidade}</td>
                  <td className="px-4 py-3">
                    <Badge variant={VARIANTE_STATUS[q.status]}>{ROTULO_STATUS[q.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{q.versao}</td>
                  <td className="px-4 py-3"><Respostas q={q} /></td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(q.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
