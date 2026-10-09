import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { ROTULO_TIPO_ACERVO } from '@/lib/memorial/rotulos'
import type { ResultadoBusca as Resultado } from '@/lib/services/memorial-busca.service'
import { SeloStatus } from './selo-status'

interface Linha {
  id: string
  rotulo: string
  detalhe?: string
  status: StatusConteudo
  href: string
}

function Grupo({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  if (linhas.length === 0) return null
  return (
    <section aria-label={titulo}>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{titulo}</h3>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {linhas.map((l) => (
          <li key={l.id}>
            <Link href={l.href} className="flex min-h-[48px] items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-slate-50">
              <span className="min-w-0">
                <span className="block truncate text-slate-900">{l.rotulo}</span>
                {l.detalhe && <span className="block text-xs text-slate-500">{l.detalhe}</span>}
              </span>
              <SeloStatus status={l.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Resultado da busca do painel, agrupado por tipo de conteúdo. */
export function ResultadoBusca({ termo, resultado }: { termo: string; resultado: Resultado }) {
  const { exposicoes, acervo, pessoas, eventos } = resultado
  const total = exposicoes.length + acervo.length + pessoas.length + eventos.length

  if (total === 0) {
    return <p className="text-sm text-slate-600">Nada encontrado para “{termo}”. Tente outra grafia ou só parte do nome.</p>
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Grupo titulo="Pessoas" linhas={pessoas.map((p) => ({ id: p.id, rotulo: p.nome, status: p.status, href: `/admin/memorial/pessoas/${p.id}` }))} />
      <Grupo
        titulo="Acervo"
        linhas={acervo.map((i) => ({ id: i.id, rotulo: i.titulo, detalhe: ROTULO_TIPO_ACERVO[i.tipo], status: i.status, href: `/admin/memorial/acervo/${i.id}` }))}
      />
      <Grupo
        titulo="Eventos"
        linhas={eventos.map((e) => ({ id: e.id, rotulo: e.titulo, detalhe: e.ano ? String(e.ano) : undefined, status: e.status, href: `/admin/memorial/pessoas/eventos/${e.id}` }))}
      />
      <Grupo titulo="Exposições" linhas={exposicoes.map((e) => ({ id: e.id, rotulo: e.titulo, status: e.status, href: `/admin/memorial/exposicoes/${e.id}` }))} />
    </div>
  )
}
