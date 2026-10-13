import { BlocoSecao } from '@/app/admin/memorial/_ui'
import type { ContagemGrupo } from '@/lib/memorial/agendamento/relatorio'
import { numero } from './calculos'

interface Props {
  titulo: string
  grupos: ContagemGrupo[]
  /** Cor da barra (classe de fundo). Uma por gráfico, para distinguir lado a lado. */
  corBarra: string
}

/** Grupos em ordem de tamanho; a barra mede a fatia de pessoas e o número vem escrito ao lado. */
export function BarrasRanking({ titulo, grupos, corBarra }: Props) {
  const total = grupos.reduce((s, g) => s + g.visitantes, 0)
  const ordenados = [...grupos].sort((a, b) => b.visitantes - a.visitantes || a.chave.localeCompare(b.chave))
  const maior = Math.max(1, ...ordenados.map((g) => g.visitantes))

  return (
    <BlocoSecao titulo={titulo} dica={total > 0 ? `${numero(total)} pessoas no período` : undefined}>
      {ordenados.length === 0 ? (
        <p className="text-sm text-tinta-700">Nenhuma visita na agenda neste período.</p>
      ) : (
        <ul className="space-y-4">
          {ordenados.map((g) => (
            <li key={g.chave}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 break-words text-sm font-semibold text-tinta-900">{g.chave}</span>
                <span className="shrink-0 text-sm tabular-nums text-tinta-700">
                  <strong className="text-base text-tinta-900">{numero(g.visitantes)}</strong> pessoas · {numero(g.visitas)}{' '}
                  {g.visitas === 1 ? 'visita' : 'visitas'}
                </span>
              </div>
              <span aria-hidden="true" className={`mt-1.5 block h-2.5 rounded-full ${corBarra}`} style={{ width: `${Math.max(2, (g.visitantes / maior) * 100)}%` }} />
              <span className="sr-only">{Math.round((g.visitantes / total) * 100)}% das pessoas</span>
            </li>
          ))}
        </ul>
      )}
    </BlocoSecao>
  )
}
