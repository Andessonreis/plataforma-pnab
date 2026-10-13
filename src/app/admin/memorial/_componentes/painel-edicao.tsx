import Link from 'next/link'
import type { ReactNode } from 'react'
import type { StatusConteudo } from '@prisma/client'
import { IconExternalLink } from '@/components/ui'
import type { EntidadeMemorial } from '@/lib/services/memorial-conteudo.service'
import { BotaoExcluir } from './botao-excluir'
import { CabecalhoAdmin } from './cabecalho-admin'
import { ControleStatus } from './controle-status'
import { HistoricoVersoes } from './historico-versoes'

interface PainelEdicaoProps {
  titulo: string
  voltar: { href: string; rotulo: string }
  endpoint: string
  status: StatusConteudo
  pendencias: string[]
  entidade: EntidadeMemorial
  entidadeId: string
  /** Endereço no site, quando o conteúdo está publicado. */
  linkPublico?: string
  destinoExclusao: string
  children: ReactNode
}

/**
 * Página de edição de qualquer conteúdo do Memorial: formulário à esquerda e, ao lado,
 * a etapa editorial, o link no site, o histórico de versões e a exclusão.
 */
export function PainelEdicao(p: PainelEdicaoProps) {
  return (
    <section>
      <CabecalhoAdmin titulo={p.titulo} voltar={p.voltar}>
        {p.linkPublico && (
          <Link
            href={p.linkPublico}
            target="_blank"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver no site
            <IconExternalLink className="h-4 w-4" />
          </Link>
        )}
      </CabecalhoAdmin>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="order-2 lg:order-1">{p.children}</div>
        <aside className="order-1 space-y-4 lg:order-2" aria-label="Publicação e histórico">
          <ControleStatus endpoint={p.endpoint} status={p.status} pendencias={p.pendencias} />
          <HistoricoVersoes entidade={p.entidade} entidadeId={p.entidadeId} />
          <BotaoExcluir endpoint={p.endpoint} nome={p.titulo} destino={p.destinoExclusao} />
        </aside>
      </div>
    </section>
  )
}
