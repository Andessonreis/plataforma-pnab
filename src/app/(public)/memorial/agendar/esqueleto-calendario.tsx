import { diaDaSemana, intervaloDoMes } from '@/lib/memorial/agendamento/datas'

/**
 * Lugar do calendário enquanto a agenda do mês não chega: a mesma grade, com o mesmo
 * tamanho, para a tela não pular quando os dias aparecem.
 */
export function EsqueletoCalendario({ mes }: { mes: string }) {
  const { de, ate } = intervaloDoMes(mes)
  const vazios = diaDaSemana(de)
  const total = Number(ate.slice(8))

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Consultando a agenda do mês…</span>
      <div className="grid grid-cols-7 gap-1 pt-8" aria-hidden="true">
        {Array.from({ length: vazios }, (_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-11 animate-pulse bg-tinta-900/[0.06] motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  )
}
