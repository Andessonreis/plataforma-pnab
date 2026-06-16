interface DeclaracaoColetivoFieldProps {
  onFileChange: (file: File | null) => void
}

export function DeclaracaoColetivoField({ onFileChange }: DeclaracaoColetivoFieldProps) {
  return (
    <div className="w-full">
      <label
        htmlFor="declaracao-coletivo"
        className="block text-sm font-medium text-slate-700 mb-1.5"
      >
        Declaração do Coletivo (PDF)
        <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
      </label>
      <input
        id="declaracao-coletivo"
        type="file"
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          onFileChange(file)
        }}
        className={[
          'block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          'min-h-[44px]',
          'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
          'file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5',
          'file:text-sm file:font-medium file:text-brand-700 file:cursor-pointer',
          'hover:file:bg-brand-100',
        ].join(' ')}
      />
      <p className="mt-1.5 text-sm text-slate-500">
        Documento que comprova a existência e representação do coletivo.
      </p>
    </div>
  )
}
