import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { ROTULO_TIPO_ACERVO } from '@/lib/memorial/rotulos'
import type { ResultadoBusca as Resultado } from '@/lib/services/memorial-busca.service'
import { StatusChip } from '@/app/admin/memorial/_ui'

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
      <h3 className="mb-2 text-sm font-bold text-tinta-800">{titulo}</h3>
      <ul className="divide-y divide-tinta-900/10 rounded-lg border border-tinta-900/10 bg-white">
        {linhas.map((l) => (
          <li key={l.id}>
            <Link href={l.href} className="flex min-h-[48px] items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-papel-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-500">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-tinta-900">{l.rotulo}</span>
                {l.detalhe && <span className="block text-xs text-tinta-600">{l.detalhe}</span>}
              </span>
              <StatusChip tipo="conteudo" status={l.status} />
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
    return <p className="rounded-lg border border-dashed border-tinta-900/20 bg-white px-4 py-4 text-sm text-tinta-700">Nada encontrado para “{termo}”. Tente outra grafia ou só parte do nome.</p>
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
