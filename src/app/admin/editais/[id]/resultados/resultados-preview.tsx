import type { PreviewRow, VagasConfig } from './types'
import { faixa, faixaPorCategoria } from './preview-faixa'
import { AvisoPreview, SemInscricoes } from './preview-notices'
import { PreviewTable } from './preview-table'
import { PreviewMobileCards } from './preview-mobile-cards'

export type { PreviewRow, VagasConfig }

interface Props {
  rows: PreviewRow[]
  vagas: VagasConfig
  hasFormula: boolean
}

export function ResultadosPreview({ rows, vagas, hasFormula }: Props) {
  const usaCategorias = rows.some((r) => r.posicaoCategoria != null)
  const mostraFaixa = usaCategorias || vagas.contemplados != null || vagas.notaMinima != null
  const decimals = hasFormula ? 2 : 2

  if (usaCategorias) {
    const porCategoria = new Map<string, PreviewRow[]>()
    for (const r of rows) {
      const key = r.categoria ?? '—'
      if (!porCategoria.has(key)) porCategoria.set(key, [])
      porCategoria.get(key)!.push(r)
    }
    for (const grupo of porCategoria.values()) {
      grupo.sort((a, b) => (a.posicaoCategoria ?? 0) - (b.posicaoCategoria ?? 0))
    }

    return (
      <div className="space-y-4">
        <AvisoPreview />
        {rows.length === 0 ? (
          <SemInscricoes />
        ) : (
          [...porCategoria.entries()].map(([categoria, grupo]) => (
            <div key={categoria} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <p className="text-sm font-medium text-slate-700 px-4 pt-4">{categoria}</p>
              <PreviewMobileCards
                rows={grupo}
                mostraFaixa={mostraFaixa}
                decimals={decimals}
                mostraCategoria={false}
                getFaixa={(r) => faixaPorCategoria(r, vagas)}
                getPos={(r) => r.posicaoCategoria ?? 0}
              />
              <PreviewTable
                rows={grupo}
                mostraFaixa={mostraFaixa}
                decimals={decimals}
                mostraCategoria={false}
                getFaixa={(r) => faixaPorCategoria(r, vagas)}
                getPos={(r) => r.posicaoCategoria ?? 0}
              />
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AvisoPreview />
      {rows.length === 0 ? (
        <SemInscricoes />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <PreviewMobileCards
            rows={rows}
            mostraFaixa={mostraFaixa}
            decimals={decimals}
            mostraCategoria
            getFaixa={(r, index) => faixa(index + 1, r.notaFinal, r.finalizadas, vagas)}
            getPos={(_r, index) => index + 1}
          />
          <PreviewTable
            rows={rows}
            mostraFaixa={mostraFaixa}
            decimals={decimals}
            mostraCategoria
            getFaixa={(r, index) => faixa(index + 1, r.notaFinal, r.finalizadas, vagas)}
            getPos={(_r, index) => index + 1}
          />
        </div>
      )}
    </div>
  )
}
