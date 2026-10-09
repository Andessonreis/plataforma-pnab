const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

/** Folha de calendário: o dia da visita salta aos olhos em qualquer lista. Data em UTC (@db.Date). */
export function FolhaData({ data, className = '' }: { data: Date | string; className?: string }) {
  const d = new Date(data)
  return (
    <div
      className={`flex w-14 shrink-0 flex-col overflow-hidden rounded-lg border border-tinta-900/15 bg-white text-center ${className}`}
      aria-label={`${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()].toLowerCase()}`}
    >
      <span className="bg-brand-600 py-0.5 text-[10px] font-bold tracking-widest text-white">{MESES[d.getUTCMonth()]}</span>
      <span className="pt-0.5 text-xl font-bold leading-6 text-tinta-900">{d.getUTCDate()}</span>
      <span className="pb-0.5 text-[10px] font-semibold uppercase text-tinta-500">{DIAS[d.getUTCDay()]}</span>
    </div>
  )
}
