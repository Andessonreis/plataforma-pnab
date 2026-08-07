interface Contexto {
  entidadeNome: string
  projetoNome: string
  responsavelNome: string
}

/** Bloco "Dados do pedido" — equivalente ao topo do Anexo 07, preenchido automaticamente. */
export function RecursoContextSummary({ entidadeNome, projetoNome, responsavelNome }: Contexto) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-1.5">
      <p className="text-sm font-medium text-slate-700">Dados do pedido</p>
      <p><span className="text-slate-500">Entidade:</span> <span className="font-medium text-slate-900">{entidadeNome}</span></p>
      <p><span className="text-slate-500">Projeto:</span> <span className="font-medium text-slate-900">{projetoNome}</span></p>
      <p><span className="text-slate-500">Responsável legal:</span> <span className="font-medium text-slate-900">{responsavelNome}</span></p>
      <p className="text-xs text-slate-500 pt-1">
        Estas informações serão registradas como parte do seu recurso junto com a data de envio (equivale ao preenchimento manual do Anexo 07).
      </p>
    </div>
  )
}
