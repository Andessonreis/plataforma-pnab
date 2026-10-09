import Link from 'next/link'
import type { InscricaoStatus } from '@prisma/client'
import { IconArrowRight } from '@/components/ui'
import { Carimbo } from '@/components/ui/carimbo'
import { inscricaoStatusLabelProponente } from '@/lib/status-maps'
import { formatDate } from '@/lib/utils/format'
import { botaoTinta, linkTexto } from '../estilos'
import { tomCarimboDeStatus } from '../status-carimbo'
import { SITUACAO_EXPLICADA, type ProximoPasso } from './proximo-passo'

export interface InscricaoFicha {
  id: string
  numero: string
  categoria: string | null
  status: InscricaoStatus
  submittedAt: Date | null
  createdAt: Date
  editalTitulo: string
  passo: ProximoPasso
}

interface InscricaoItemProps {
  inscricao: InscricaoFicha
  /** Só a primeira ficha da lista recebe as âncoras do tour guiado. */
  destaqueTour?: boolean
}

/**
 * Ficha de uma inscrição: situação em carimbo com a explicação ao lado, o
 * edital como título e, na coluna da direita, o próximo passo. A ação vira
 * botão cheio só quando depende do proponente e tem prazo; no resto é link.
 */
export function InscricaoItem({ inscricao, destaqueTour }: InscricaoItemProps) {
  const { passo } = inscricao
  const datacao = inscricao.submittedAt
    ? `Enviada em ${formatDate(inscricao.submittedAt)}`
    : `Começada em ${formatDate(inscricao.createdAt)}`

  return (
    <li className="grid gap-x-10 gap-y-4 border-b border-tinta-900/15 py-6 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-center">
      <div className="min-w-0">
        <div id={destaqueTour ? 'tour-inscricoes-carimbo' : undefined} className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Carimbo tom={tomCarimboDeStatus(inscricao.status)}>{inscricaoStatusLabelProponente[inscricao.status]}</Carimbo>
          <span className="text-sm text-tinta-700">{SITUACAO_EXPLICADA[inscricao.status]}</span>
        </div>

        <h2 className="mt-3 text-lg font-semibold leading-snug text-tinta-900 sm:text-xl">
          <Link
            href={`/proponente/inscricoes/${inscricao.id}`}
            className="underline-offset-4 [@media(hover:hover)]:hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
          >
            {inscricao.editalTitulo}
          </Link>
        </h2>

        <p className="mt-1 text-sm text-tinta-700">
          {/* deslop-ignore-next-line 34 número de protocolo, identificador real */}
          Protocolo <span className="font-mono text-tinta-900">{inscricao.numero}</span>
          {inscricao.categoria && <> · {inscricao.categoria}</>} · {datacao}
        </p>
      </div>

      <div id={destaqueTour ? 'tour-inscricoes-acao' : undefined} className="flex flex-col gap-2 lg:items-end lg:text-right">
        {passo.aviso && (
          <p className={`text-sm ${passo.urgente ? 'font-bold text-brand-700' : 'text-tinta-700'}`}>{passo.aviso}</p>
        )}
        <Link href={passo.href} className={passo.urgente ? `${botaoTinta} w-full sm:w-auto` : `${linkTexto} self-start lg:self-end`}>
          {passo.rotulo}
          <IconArrowRight className="h-4 w-4" />
          {/* Vários itens repetem "Ver resultado"; o edital desambigua pro leitor de tela. */}
          <span className="sr-only">: {inscricao.editalTitulo}</span>
        </Link>
      </div>
    </li>
  )
}
