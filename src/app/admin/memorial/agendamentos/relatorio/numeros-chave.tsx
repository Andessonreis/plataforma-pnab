import type { RelatorioVisitas } from '@/lib/memorial/agendamento/relatorio'
import { formatarDiaCurto } from '@/lib/memorial/agendamento/datas'
import { AnelComparecimento } from './anel-comparecimento'
import { VariacaoPeriodo } from './variacao-periodo'
import { numero, variacao } from './calculos'

interface Props {
  atual: RelatorioVisitas
  anterior: RelatorioVisitas
  de: string
  ate: string
  periodoAnterior: { de: string; ate: string }
}

/** Os três números de apoio, ao lado de quanto valiam no período anterior. */
function Apoio({ rotulo, valor, antes, detalhe }: { rotulo: string; valor: number; antes: number; detalhe?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-semibold text-papel-200">{rotulo}</dt>
      <dd className="mt-1">
        <span className="block text-3xl font-bold tabular-nums leading-none text-white">{numero(valor)}</span>
        {detalhe && <span className="mt-1 block text-sm text-papel-200">{detalhe}</span>}
        <VariacaoPeriodo variacao={variacao(valor, antes)} anterior={antes} className="mt-1 text-papel-200" />
      </dd>
    </div>
  )
}

/**
 * Bloco de abertura do relatório: o número que a Secretaria cita em prestação de contas
 * (pessoas na agenda) em tamanho de manchete, o comparecimento em anel e os apoios abaixo.
 */
export function NumerosChave({ atual, anterior, de, ate, periodoAnterior }: Props) {
  const faltas = atual.porStatus.NAO_COMPARECEU ?? 0
  return (
    <section aria-labelledby="titulo-numeros" className="rounded-2xl bg-tinta-900 p-5 text-white sm:p-7">
      <h2 id="titulo-numeros" className="text-sm font-semibold text-papel-200">
        De {formatarDiaCurto(de)} a {formatarDiaCurto(ate)}
        <span className="font-normal"> · comparado com {formatarDiaCurto(periodoAnterior.de)} a {formatarDiaCurto(periodoAnterior.ate)}</span>
      </h2>

      <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-10">
        <div>
          <p className="text-7xl font-bold leading-none tabular-nums sm:text-8xl">{numero(atual.visitantes)}</p>
          <p className="mt-2 text-lg font-semibold">pessoas na agenda do Memorial</p>
          <VariacaoPeriodo variacao={variacao(atual.visitantes, anterior.visitantes)} anterior={anterior.visitantes} className="mt-1 text-papel-200" />
        </div>
        <AnelComparecimento taxa={atual.taxaComparecimento} realizadas={atual.realizadas} faltas={faltas} />
      </div>

      <dl className="mt-7 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-3">
        <Apoio rotulo="Pedidos recebidos" valor={atual.pedidos} antes={anterior.pedidos} />
        <Apoio rotulo="Visitas na agenda" valor={atual.visitas} antes={anterior.visitas} />
        <Apoio
          rotulo="Visitas realizadas"
          valor={atual.realizadas}
          antes={anterior.realizadas}
          detalhe={`${numero(atual.visitantesRealizados)} pessoas atendidas`}
        />
      </dl>
    </section>
  )
}
