import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { UserAvatar } from '@/components/ui'
import { stripMarkdown } from '@/lib/utils/markdown-blocos'
import { StatusChip } from '@/app/admin/memorial/_ui'

interface Pessoa {
  id: string
  nome: string
  periodo: string | null
  biografia: string | null
  fotoUrl: string | null
  status: StatusConteudo
}

/** Pessoas em cartões com retrato (ou inicial), para reconhecer de relance quem é quem. */
export function GradePessoas({ pessoas }: { pessoas: Pessoa[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {pessoas.map((p) => (
        <li key={p.id}>
          <Link
            href={`/admin/memorial/pessoas/${p.id}`}
            className="group flex h-full items-start gap-4 rounded-xl border border-tinta-900/10 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-2 focus-visible:outline-accent-500"
          >
            <UserAvatar nome={p.nome} src={p.fotoUrl} size={64} className="shrink-0 text-xl ring-2 ring-papel-200" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-snug text-tinta-900 group-hover:text-brand-800">{p.nome}</span>
              <span className={`mt-0.5 block text-sm ${p.periodo ? 'font-medium text-tinta-700' : 'italic text-tinta-600'}`}>
                {p.periodo || 'Período não informado'}
              </span>
              {p.biografia ? (
                <span className="mt-1.5 line-clamp-2 block text-sm text-tinta-600">{stripMarkdown(p.biografia, 160)}</span>
              ) : (
                <span className="mt-1.5 block text-sm text-accent-900">Biografia ainda não escrita</span>
              )}
              <StatusChip tipo="conteudo" status={p.status} className="mt-3" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
