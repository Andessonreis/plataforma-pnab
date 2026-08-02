export function AvisoPreview() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <svg className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
      <div>
        <p className="text-sm font-semibold text-amber-900">Pré-visualização do ranking — nada foi publicado ainda</p>
        <p className="text-sm text-amber-800 mt-0.5">
          As notas abaixo são a média ao vivo das avaliações <strong>finalizadas</strong>. Os valores oficiais
          (posição, nota final e status) são gravados quando você publica o resultado.
        </p>
      </div>
    </div>
  )
}

export function SemInscricoes() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p className="text-slate-500">Nenhuma inscrição avaliada ainda.</p>
      <p className="text-sm text-slate-400 mt-1">O ranking aparece conforme os avaliadores finalizam as notas.</p>
    </div>
  )
}
