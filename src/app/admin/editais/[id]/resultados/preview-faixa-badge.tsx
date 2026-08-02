import { TONE_CLASS, type Faixa } from './preview-faixa'

/** Selo visual da faixa simulada — reaproveitado pela tabela desktop e pelos cards mobile. */
export function FaixaBadge({ faixa }: { faixa: Faixa }) {
  if (!faixa) return <span className="text-slate-400">—</span>

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${TONE_CLASS[faixa.tone]}`}>
      {faixa.label}
    </span>
  )
}
