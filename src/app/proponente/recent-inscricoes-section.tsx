import Link from 'next/link'
import { EmptyState, IconClipboard } from '@/components/ui'
import { Cartela } from '@/components/ui/cartela'
import { InscricaoRecenteItem } from './inscricao-recente-item'
import type { InscricaoStatus } from '@prisma/client'

interface RecentInscricao {
  id: string
  numero: string
  status: InscricaoStatus
  createdAt: Date
  edital: { titulo: string }
}

interface RecentInscricoesSectionProps {
  inscricoes: RecentInscricao[]
  total: number
}

export function RecentInscricoesSection({ inscricoes, total }: RecentInscricoesSectionProps) {
  return (
    <div id="tour-inscricoes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Cartela cor="terracota">Inscrições Recentes</Cartela>
        {total > 5 && (
          <Link href="/proponente/inscricoes" className="rotulo text-xs text-brand-700 hover:text-brand-800">
            Ver todas
          </Link>
        )}
      </div>

      <div className="rounded-b-lg border border-t-0 border-tinta-900/10 bg-white px-4 py-2 sm:px-6">
        {inscricoes.length === 0 ? (
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-500" />}
            title="Nenhuma inscrição ainda"
            description="Confira os editais abertos e faça sua primeira inscrição."
            action={{ label: 'Ver Editais Abertos', href: '/editais' }}
          />
        ) : (
          inscricoes.map((inscricao) => (
            <InscricaoRecenteItem
              key={inscricao.id}
              id={inscricao.id}
              numero={inscricao.numero}
              status={inscricao.status}
              createdAt={inscricao.createdAt}
              editalTitulo={inscricao.edital.titulo}
            />
          ))
        )}
      </div>
    </div>
  )
}
