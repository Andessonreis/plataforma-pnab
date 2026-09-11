import { Badge } from '@/components/ui'
import type { LinhaBonus } from './aggregate'

interface Props {
  linhas: LinhaBonus[]
}

/** Planilha de conferência: quem recebeu bônus, de qual cota, e o efeito na nota. */
export function BonusTable({ linhas }: Props) {
  if (linhas.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-6 text-center">
        Nenhuma inscrição avaliada com cota bônus até agora.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left py-2.5 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">Número</th>
            <th className="text-left py-2.5 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">Proponente</th>
            <th className="text-left py-2.5 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">Categoria</th>
            <th className="text-left py-2.5 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">Cotas</th>
            <th className="text-right py-2.5 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">Nota avaliadores</th>
            <th className="text-right py-2.5 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">Bônus</th>
            <th className="text-right py-2.5 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide">Nota com bônus</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.inscricaoId} className="border-t border-slate-100">
              <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{linha.numero}</td>
              <td className="py-2.5 px-3 font-medium text-slate-900">{linha.proponenteNome}</td>
              <td className="py-2.5 px-3 text-slate-600">{linha.categoria ?? '—'}</td>
              <td className="py-2.5 px-3">
                <div className="flex flex-wrap gap-1">
                  {linha.cotas.map((cota) => (
                    <Badge key={cota.key} variant="info">
                      {cota.label} (+{cota.pontos})
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">{linha.notaBase.toFixed(2)}</td>
              <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-700">
                +{linha.notaBonus.toFixed(2)}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                {linha.notaComBonus.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
