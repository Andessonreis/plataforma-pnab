import type { PreviewRow } from './types'
import type { Faixa } from './preview-faixa'
import { FaixaBadge } from './preview-faixa-badge'
import { ResultCard } from './result-card'

interface Props {
  rows: PreviewRow[]
  mostraFaixa: boolean
  decimals: number
  mostraCategoria: boolean
  getFaixa: (r: PreviewRow, index: number) => Faixa
  getPos: (r: PreviewRow, index: number) => number
}

/** Cards empilhados (< lg) da prévia de ranking — mesmas colunas da tabela desktop. */
export function PreviewMobileCards({ rows, mostraFaixa, decimals, mostraCategoria, getFaixa, getPos }: Props) {
  return (
    <div className="lg:hidden space-y-3 p-3">
      {rows.map((r, index) => {
        const pos = getPos(r, index)
        const pendentes = Math.max(0, r.atribuidos - r.finalizadas)
        const semAval = r.finalizadas === 0
        const f = getFaixa(r, index)

        return (
          <ResultCard
            key={r.inscricaoId}
            posicao={semAval ? '—' : pos}
            empatado={r.empatado}
            proponenteNome={r.proponenteNome}
            numero={r.numero}
            categoria={mostraCategoria ? (r.categoria ?? '—') : null}
            avaliacoes={
              <>
                {r.finalizadas} finalizada{r.finalizadas === 1 ? '' : 's'}
                {pendentes > 0 && (
                  <span className="ml-1.5 text-xs font-medium text-amber-600">
                    +{pendentes} pendente{pendentes === 1 ? '' : 's'}
                  </span>
                )}
              </>
            }
            nota={semAval ? '—' : r.notaFinal.toFixed(decimals)}
            status={mostraFaixa ? <FaixaBadge faixa={f} /> : undefined}
            detailsHref={`/admin/inscricoes/${r.inscricaoId}`}
            muted={semAval}
          />
        )
      })}
    </div>
  )
}
