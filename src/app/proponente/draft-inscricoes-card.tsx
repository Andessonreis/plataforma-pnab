import Link from 'next/link'
import { IconArrowRight } from '@/components/ui'
import { formatDate } from '@/lib/utils/format'
import { SecaoPainel } from './secao-painel'
import { VazioPainel } from './vazio-painel'

export interface DraftInscricao {
  id: string
  numero: string
  editalTitulo: string
  updatedAt: Date
}

interface DraftInscricoesCardProps {
  drafts: DraftInscricao[]
  totalDrafts: number
}

/** Rascunhos guardados, do editado por último ao mais antigo, cada um com atalho pra continuar. */
export function DraftInscricoesCard({ drafts, totalDrafts }: DraftInscricoesCardProps) {
  return (
    <SecaoPainel
      id="tour-rascunhos"
      titulo="Rascunhos"
      acao={totalDrafts > drafts.length ? { href: '/proponente/inscricoes', rotulo: `Ver os ${totalDrafts}` } : undefined}
    >
      {drafts.length === 0 ? (
        <VazioPainel
          titulo="Nenhum rascunho guardado."
          texto="A inscrição que você começar e não enviar fica salva aqui, para terminar quando puder."
        />
      ) : (
        <ul>
          {drafts.map((draft) => (
            <li key={draft.id} className="border-b border-tinta-900/15 last:border-b-0">
              <Link
                href={`/proponente/inscricoes/${draft.id}/editar`}
                className="group flex min-h-[64px] items-center justify-between gap-3 py-3 [@media(hover:hover)]:hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900"
              >
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug text-tinta-900">{draft.editalTitulo}</span>
                  <span className="block text-sm text-tinta-700">Editado em {formatDate(draft.updatedAt)}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-brand-700">
                  Continuar
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SecaoPainel>
  )
}
