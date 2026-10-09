import type { ContagemGrupo } from '@/lib/memorial/agendamento/relatorio'

export function TabelaGrupos({ titulo, coluna, grupos }: { titulo: string; coluna: string; grupos: ContagemGrupo[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">{titulo}</h2>
      {grupos.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-600">Nenhuma visita na agenda neste período.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-medium">
                {coluna}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Visitas
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                Pessoas
              </th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <tr key={g.chave} className="border-t border-slate-100">
                <th scope="row" className="px-4 py-2 text-left font-normal text-slate-800">
                  {g.chave}
                </th>
                <td className="px-2 py-2 text-right tabular-nums">{g.visitas}</td>
                <td className="px-4 py-2 text-right tabular-nums">{g.visitantes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
