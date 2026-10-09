import Link from 'next/link'
import { resumoAgendamentos } from '@/lib/services/memorial-agendamento-relatorio.service'

/**
 * Resumo das visitas no painel do Memorial. Cada número leva à lista já filtrada, para a
 * equipe ir direto do "4 pendentes" aos quatro pedidos.
 */
export async function ResumoAgendamentos() {
  const r = await resumoAgendamentos()
  const itens = [
    {
      rotulo: 'Visitas hoje',
      valor: r.visitasHoje,
      detalhe: `${r.visitantesHoje} visitantes`,
      href: '/admin/memorial/agendamentos?visao=calendario&escala=dia',
    },
    {
      rotulo: 'Pedidos pendentes',
      valor: r.pendentes,
      detalhe: 'aguardando resposta',
      href: '/admin/memorial/agendamentos?status=SOLICITADO',
    },
    {
      rotulo: 'Confirmadas',
      valor: r.confirmadas,
      detalhe: 'de hoje em diante',
      href: '/admin/memorial/agendamentos?status=CONFIRMADO',
    },
    {
      rotulo: 'Visitas este mês',
      valor: r.visitasMes,
      detalhe: `${r.visitantesMes} visitantes`,
      href: '/admin/memorial/agendamentos?visao=calendario',
    },
  ]

  return (
    <section aria-labelledby="resumo-visitas" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="resumo-visitas" className="text-base font-semibold text-slate-900">
          Visitas agendadas
        </h2>
        <Link
          href="/admin/memorial/agendamentos"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand-700 hover:underline"
        >
          Abrir agenda
        </Link>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {itens.map((i) => (
          <li key={i.rotulo}>
            <Link
              href={i.href}
              className="block rounded-lg bg-slate-50 p-3 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <p className="text-xs font-medium text-slate-600">{i.rotulo}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{i.valor}</p>
              <p className="text-xs text-slate-600">{i.detalhe}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
