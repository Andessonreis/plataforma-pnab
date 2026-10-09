import { BlocoSecao } from '@/app/admin/memorial/_ui'
import type { ContagemGrupo } from '@/lib/memorial/agendamento/relatorio'
import { numero, ordenarPorHorario } from './calculos'

const ALTURA_REM = 12

/** Colunas por horário de início, na ordem do dia; a mais cheia ganha o tom escuro. */
export function GraficoHorarios({ grupos }: { grupos: ContagemGrupo[] }) {
  const colunas = ordenarPorHorario(grupos)
  const maior = Math.max(1, ...colunas.map((g) => g.visitas))
  const pico = colunas.find((g) => g.visitas === maior)

  return (
    <BlocoSecao
      titulo="Horários mais usados"
      dica={pico ? `Mais visitas começam às ${pico.chave}: ${numero(pico.visitas)} no período.` : undefined}
    >
      {colunas.length === 0 ? (
        <p className="text-sm text-tinta-700">Nenhuma visita na agenda neste período.</p>
      ) : (
        <ul className="flex items-end gap-2 overflow-x-auto border-b border-tinta-900/20" aria-label="Visitas por horário de início">
          {colunas.map((g) => {
            const destaque = g.visitas === maior
            return (
              <li
                key={g.chave}
                className="flex min-w-[3rem] flex-1 flex-col items-center justify-end"
                aria-label={`${g.chave}: ${g.visitas} ${g.visitas === 1 ? 'visita' : 'visitas'}, ${g.visitantes} pessoas`}
              >
                <span aria-hidden="true" className="text-sm font-bold tabular-nums text-tinta-900">{numero(g.visitas)}</span>
                <span
                  aria-hidden="true"
                  className={`mt-1 w-full max-w-[4rem] rounded-t-md ${destaque ? 'bg-turquesa-800' : 'bg-turquesa-500'}`}
                  style={{ height: `${Math.max(0.25, (g.visitas / maior) * ALTURA_REM)}rem` }}
                />
                <span aria-hidden="true" className="w-full border-t border-tinta-900/20 py-2 text-center text-sm font-semibold tabular-nums text-tinta-800">
                  {g.chave}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </BlocoSecao>
  )
}
