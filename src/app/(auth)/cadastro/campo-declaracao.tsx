'use client'

interface CampoDeclaracaoProps {
  aoEscolher: (arquivo: File | null) => void
}

/**
 * Declaração do coletivo — obrigatória só para quem se inscreve como coletivo
 * cultural, que não tem CNPJ e comprova existência e representação por
 * documento assinado.
 */
export function CampoDeclaracao({ aoEscolher }: CampoDeclaracaoProps) {
  return (
    <div className="w-full">
      <label htmlFor="declaracao-coletivo" className="mb-1.5 block font-medium text-tinta-800">
        Declaração do coletivo (PDF)
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      </label>
      <input
        id="declaracao-coletivo"
        type="file"
        accept=".pdf"
        aria-describedby="declaracao-coletivo-hint"
        onChange={(e) => aoEscolher(e.target.files?.[0] ?? null)}
        className={[
          'block w-full rounded-lg border border-tinta-900/15 px-3 py-2.5 text-sm text-tinta-700',
          'transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
          'file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-papel-100 file:px-3',
          'file:py-1.5 file:text-sm file:font-medium file:text-tinta-800 hover:file:bg-papel-200',
        ].join(' ')}
      />
      <p id="declaracao-coletivo-hint" className="mt-1.5 text-sm text-tinta-700">
        Documento que comprova a existência e representação do coletivo.
      </p>
    </div>
  )
}
