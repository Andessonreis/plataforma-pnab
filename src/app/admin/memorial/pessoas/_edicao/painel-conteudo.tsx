import type { ReactNode } from 'react'
import type { StatusConteudo } from '@prisma/client'
import { IconExternalLink } from '@/components/ui'
import type { EntidadeMemorial } from '@/lib/services/memorial-conteudo.service'
import { BotaoExcluir } from '@/app/admin/memorial/_componentes/botao-excluir'
import { HistoricoVersoes } from '@/app/admin/memorial/_componentes/historico-versoes'
import { CabecalhoPagina, botaoNeutro } from '@/app/admin/memorial/_ui'
import { FluxoPublicacao } from '@/app/admin/memorial/_ui/config-fluxo-publicacao'

interface Props {
  titulo: string
  voltar: { href: string; rotulo: string }
  endpoint: string
  status: StatusConteudo
  pendencias: string[]
  entidade: EntidadeMemorial
  entidadeId: string
  /** Página no site, só quando já está publicado. */
  linkPublico?: string
  destinoExclusao: string
  children: ReactNode
}

/**
 * Edição de pessoa ou evento: o caminho até o site fica no topo, à vista,
 * o formulário logo abaixo e o histórico ao lado (no celular, depois do formulário).
 */
export function PainelConteudo(p: Props) {
  return (
    <section>
      <CabecalhoPagina
        titulo={p.titulo}
        voltar={p.voltar}
        acoes={
          p.linkPublico && (
            <a href={p.linkPublico} target="_blank" rel="noopener noreferrer" className={botaoNeutro}>
              Ver no site
              <IconExternalLink className="h-4 w-4" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          )
        }
      />
      <FluxoPublicacao endpoint={p.endpoint} status={p.status} pendencias={p.pendencias} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">{p.children}</div>
        <aside className="space-y-4" aria-label="Histórico e exclusão">
          <HistoricoVersoes entidade={p.entidade} entidadeId={p.entidadeId} />
          <div className="rounded-xl border border-red-200 bg-white p-4">
            <h2 className="text-sm font-bold text-tinta-900">Excluir de vez</h2>
            <p className="mb-3 mt-1 text-sm text-tinta-600">Some do painel e do site. Para só tirar do site, use os botões do caminho acima.</p>
            <BotaoExcluir endpoint={p.endpoint} nome={p.titulo} destino={p.destinoExclusao} />
          </div>
        </aside>
      </div>
    </section>
  )
}
