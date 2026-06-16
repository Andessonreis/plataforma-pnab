interface ParecerSectionProps {
  parecer: string
  onChange: (value: string) => void
}

export function ParecerSection({ parecer, onChange }: ParecerSectionProps) {
  return (
    <div>
      <label htmlFor="parecer" className="block text-sm font-medium text-slate-800 mb-1.5">
        Parecer Técnico
        <span className="ml-1.5 text-xs font-normal text-slate-400">(opcional)</span>
      </label>
      <textarea
        id="parecer"
        rows={5}
        value={parecer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Descreva sua análise qualitativa sobre a proposta: pontos fortes, fragilidades, potencial de impacto cultural..."
        className="w-full text-sm text-slate-800 placeholder:text-slate-400 rounded-lg border border-slate-200 px-3.5 py-2.5 resize-y leading-relaxed
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
      />
      <p className="text-right text-[11px] text-slate-400 mt-1">{parecer.length} caracteres</p>
    </div>
  )
}
