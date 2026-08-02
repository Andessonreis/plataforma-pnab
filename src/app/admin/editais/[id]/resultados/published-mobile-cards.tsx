import { Badge } from '@/components/ui'
import { inscricaoStatusLabel, inscricaoStatusVariant } from '@/lib/status-maps'
import { ResultCard } from './result-card'
import type { PublishedRow } from './published-types'

interface Props {
  rows: PublishedRow[]
  mostraCategoria: boolean
}

/** Cards empilhados (< lg) do resultado oficial pós-publicação — mesmas colunas da tabela desktop. */
export function PublishedMobileCards({ rows, mostraCategoria }: Props) {
  return (
    <div className="lg:hidden space-y-3 p-3">
      {rows.map((row) => (
        <ResultCard
          key={row.inscricaoId}
          posicao={row.posicaoExibida}
          empatado={row.isEmpatada}
          proponenteNome={row.proponenteNome}
          numero={row.numero}
          categoria={mostraCategoria ? (row.categoria ?? '—') : null}
          avaliacoes={`${row.totalAvaliacoes} avalia${row.totalAvaliacoes === 1 ? 'ção' : 'ções'}`}
          nota={row.notaFinal != null ? row.notaFinal.toFixed(2) : '—'}
          status={<Badge variant={inscricaoStatusVariant[row.status]}>{inscricaoStatusLabel[row.status]}</Badge>}
          detailsHref={`/admin/inscricoes/${row.inscricaoId}`}
        />
      ))}
    </div>
  )
}
