import type { ContagemGrupo } from '@/lib/memorial/agendamento/relatorio'

/** Contagem por grupo com uma barra proporcional ao número de pessoas, para comparar de relance. */
export function TabelaGrupos({ titulo, coluna, grupos }: { titulo: string; coluna: string; grupos: ContagemGrupo[] }) {
  const maior = Math.max(1, ...grupos.map((g) => g.visitantes))
  return (
    <section className="overflow-hidden rounded-xl border border-tinta-900/15 bg-white">
      <h2 className="border-b border-tinta-900/10 px-4 py-3 text-sm font-bold text-tinta-900">{titulo}</h2>
      {grupos.length === 0 ? (
        <p className="px-4 py-4 text-sm text-tinta-700">Nenhuma visita na agenda neste período.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-papel-50 text-xs text-tinta-700">
            <tr>
              <th scope="col" className="px-4 py-2 text-left font-bold">
                {coluna}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-bold">
                Visitas
              </th>
              <th scope="col" className="px-4 py-2 text-right font-bold">
                Pessoas
              </th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <tr key={g.chave} className="border-t border-tinta-900/10">
                <th scope="row" className="px-4 py-2 text-left font-normal text-tinta-900">
                  {g.chave}
                  <span aria-hidden="true" className="mt-1 block h-1.5 rounded-full bg-turquesa-500" style={{ width: `${(g.visitantes / maior) * 100}%` }} />
                </th>
                <td className="px-2 py-2 text-right tabular-nums text-tinta-900">{g.visitas}</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-tinta-900">{g.visitantes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
