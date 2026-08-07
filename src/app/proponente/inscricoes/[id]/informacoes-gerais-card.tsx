import { formatDateTime } from '@/lib/utils/format'

interface Props {
  numero: string
  categoria: string | null
  submittedAt: Date | null
  notaFinal: unknown
  formulaAvaliacao: boolean
  resultadoVisivel: boolean
}

/**
 * Primeira seção do corpo do documento — mesma linguagem visual das
 * seções de `DadosInscricaoView` logo abaixo (rounded-lg, p-4/5) para que
 * a página leia como um documento contínuo, não uma pilha de cards soltos.
 */
export function InformacoesGeraisCard({
  numero,
  categoria,
  submittedAt,
  notaFinal,
  formulaAvaliacao,
  resultadoVisivel,
}: Props) {
  const mostrarNota = resultadoVisivel && notaFinal != null

  return (
    <section id="tour-detalhe-info" className="rounded-lg border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Informações Gerais</h2>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
        {/* col-span-2 no mobile — número do processo é longo e, numa coluna
            só, quebrava em 3 linhas e desalinhava a célula de Categoria ao lado. */}
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-sm text-slate-500">Número</dt>
          <dd className="text-sm font-medium text-slate-900 font-mono mt-0.5">{numero}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Categoria</dt>
          <dd className="text-sm font-medium text-slate-900 mt-0.5">{categoria ?? 'Não informada'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Data de Envio</dt>
          <dd className="text-sm font-medium text-slate-900 mt-0.5">
            {submittedAt ? formatDateTime(submittedAt) : 'Não enviada'}
          </dd>
        </div>
        {mostrarNota && (
          <div>
            <dt className="text-sm text-slate-500">
              {formulaAvaliacao ? 'Pontuação Final' : 'Nota Final'}
            </dt>
            <dd className="text-xl font-semibold text-brand-700 mt-0.5">
              {Number(notaFinal).toFixed(2)}{formulaAvaliacao ? ' pts' : ''}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
