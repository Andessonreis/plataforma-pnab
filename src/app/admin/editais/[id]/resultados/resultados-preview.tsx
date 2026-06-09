import Link from 'next/link'

export interface PreviewRow {
  inscricaoId: string
  numero: string
  proponenteNome: string
  categoria: string | null
  notaFinal: number
  finalizadas: number
  atribuidos: number
  empatado: boolean
}

export interface VagasConfig {
  contemplados: number | null
  suplentes: number | null
  notaMinima: number | null
}

interface Props {
  rows: PreviewRow[]
  vagas: VagasConfig
  hasFormula: boolean
}

type Tone = 'emerald' | 'amber' | 'red' | 'slate'

const TONE_CLASS: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function faixa(
  pos: number,
  notaFinal: number,
  finalizadas: number,
  vagas: VagasConfig,
): { label: string; tone: Tone } | null {
  if (finalizadas === 0) return { label: 'Sem avaliação', tone: 'slate' }
  if (vagas.notaMinima != null && notaFinal < vagas.notaMinima) {
    return { label: 'Abaixo da nota mínima', tone: 'red' }
  }
  if (vagas.contemplados != null) {
    if (pos <= vagas.contemplados) return { label: 'Contemplável', tone: 'emerald' }
    if (vagas.suplentes == null || pos <= vagas.contemplados + vagas.suplentes) {
      return { label: 'Suplente', tone: 'amber' }
    }
    return { label: 'Fora do corte', tone: 'slate' }
  }
  return null
}

export function ResultadosPreview({ rows, vagas, hasFormula }: Props) {
  const mostraFaixa = vagas.contemplados != null || vagas.notaMinima != null
  const decimals = hasFormula ? 2 : 2

  return (
    <div className="space-y-4">
      {/* Aviso de pré-visualização */}
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

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Nenhuma inscrição avaliada ainda.</p>
          <p className="text-sm text-slate-400 mt-1">O ranking aparece conforme os avaliadores finalizam as notas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Pos.</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Proponente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Categoria</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Avaliações</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Nota final (prévia)</th>
                  {mostraFaixa && (
                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Faixa simulada</th>
                  )}
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, index) => {
                  const pos = index + 1
                  const pendentes = Math.max(0, r.atribuidos - r.finalizadas)
                  const semAval = r.finalizadas === 0
                  const f = faixa(pos, r.notaFinal, r.finalizadas, vagas)
                  return (
                    <tr key={r.inscricaoId} className={`hover:bg-slate-50 transition-colors ${semAval ? 'opacity-70' : ''}`}>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <span className="flex items-center gap-1.5">
                          {semAval ? '—' : pos}
                          {r.empatado && (
                            <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Empate
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{r.proponenteNome}</p>
                        <p className="text-xs text-slate-400">{r.numero}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{r.categoria ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className="text-slate-700">{r.finalizadas} finalizada{r.finalizadas === 1 ? '' : 's'}</span>
                        {pendentes > 0 && (
                          <span className="ml-1.5 text-xs font-medium text-amber-600">
                            +{pendentes} pendente{pendentes === 1 ? '' : 's'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 tabular-nums">
                          {semAval ? '—' : r.notaFinal.toFixed(decimals)}
                        </span>
                      </td>
                      {mostraFaixa && (
                        <td className="py-3 px-4">
                          {f ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${TONE_CLASS[f.tone]}`}>
                              {f.label}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/inscricoes/${r.inscricaoId}`}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
