interface Props {
  motivo: string | null
}

/** Estado irreversível-negativo: faixa vermelha na borda, sem preenchimento colorido. */
export function MotivoInabilitacaoCard({ motivo }: Props) {
  if (!motivo) return null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
        <span className="text-red-700">Motivo da Inabilitação</span>
      </h2>
      <p className="text-sm text-slate-900 break-words">{motivo}</p>
    </section>
  )
}
