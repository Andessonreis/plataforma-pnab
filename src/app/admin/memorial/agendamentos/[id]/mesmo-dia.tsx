import { BlocoVisita } from '@/app/admin/memorial/_ui/agenda-semana'
import type { VisitaCartao } from '@/app/admin/memorial/_ui/agenda-visita'

interface Props {
  visitaId: string
  doDia: VisitaCartao[]
  conflitos: string[]
}

/**
 * O resto do dia da visita, para decidir sabendo quem mais vem. Conflitos de horário
 * aparecem primeiro, em frase, antes da lista.
 */
export function MesmoDia({ visitaId, doDia, conflitos }: Props) {
  const outras = doDia.filter((v) => v.id !== visitaId)
  if (outras.length === 0 && conflitos.length === 0) {
    return <p className="text-sm text-tinta-700">Nenhum outro grupo marcado para este dia.</p>
  }
  return (
    <div className="space-y-3">
      {conflitos.length > 0 && (
        <div role="note" className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-3">
          <p className="text-sm font-bold text-brand-900">Atenção na agenda deste dia</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-brand-900">
            {conflitos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {outras.length > 0 && (
        <>
          <p className="text-sm text-tinta-700">
            {outras.length === 1 ? 'Outro grupo neste dia:' : `Outros ${outras.length} grupos neste dia:`}
          </p>
          <ul className="space-y-1.5">
            {outras.map((v) => (
              <li key={v.id}>
                <BlocoVisita visita={v} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
