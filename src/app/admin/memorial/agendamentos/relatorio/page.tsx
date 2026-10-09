import type { Metadata } from 'next'
import { requireRole } from '@/app/admin/require-role'
import { lerFiltros } from '@/app/admin/memorial/_componentes/parametros'
import { CabecalhoPagina, VazioAcionavel } from '@/app/admin/memorial/_ui'
import { IconChart } from '@/components/ui'
import { relatorioQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { diaEmIrece, intervaloDoMes, somarDias } from '@/lib/memorial/agendamento/datas'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { NumerosChave } from './numeros-chave'
import { SituacaoPedidos } from './situacao-pedidos'
import { GraficoHorarios } from './grafico-horarios'
import { BarrasRanking } from './barras-ranking'
import { relatorioComparado } from './dados'
import { BotaoBaixarPdf } from './botao-baixar-pdf'
import { PeriodoRelatorio } from './periodo-relatorio'

export const metadata: Metadata = { title: 'Relatório de visitas — Memorial' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Períodos que a equipe mais pede para prestar contas. */
function atalhosDePeriodo(hoje: string) {
  const mes = intervaloDoMes(hoje.slice(0, 7))
  const anterior = intervaloDoMes(somarDias(mes.de, -1).slice(0, 7))
  const ano = hoje.slice(0, 4)
  return [
    { rotulo: 'Este mês', ...mes },
    { rotulo: 'Mês passado', ...anterior },
    { rotulo: 'Últimos 30 dias', de: somarDias(hoje, -29), ate: hoje },
    { rotulo: `Ano de ${ano}`, de: `${ano}-01-01`, ate: `${ano}-12-31` },
  ]
}

export default async function RelatorioVisitasPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const hoje = diaEmIrece(new Date())
  const mes = intervaloDoMes(hoje.slice(0, 7))
  const { de, ate } = lerFiltros(relatorioQuerySchema.catch(mes), await searchParams)
  const { atual: r, anterior, periodoAnterior: antes } = await relatorioComparado(de, ate)
  const atalhos = atalhosDePeriodo(hoje)
  const mesPassado = atalhos[1]

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        titulo="Relatório de visitas"
        descricao="Visitas na agenda são as confirmadas e as já realizadas. Comparecimento compara as realizadas com as faltas."
        voltar={{ href: '/admin/memorial/agendamentos', rotulo: 'Agenda de visitas' }}
        acoes={<BotaoBaixarPdf de={de} ate={ate} />}
      />

      <PeriodoRelatorio de={de} ate={ate} atalhos={atalhos} />

      {r.pedidos === 0 ? (
        <VazioAcionavel
          icone={<IconChart className="h-6 w-6" />}
          titulo="Nenhum pedido de visita neste período"
          texto="Escolha outro período acima para ver os números do Memorial."
          acao={{ href: `/admin/memorial/agendamentos/relatorio?de=${mesPassado.de}&ate=${mesPassado.ate}`, rotulo: 'Ver o mês passado' }}
        />
      ) : (
        <div className="space-y-4">
          <NumerosChave atual={r} anterior={anterior} de={de} ate={ate} periodoAnterior={antes} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <GraficoHorarios grupos={r.porHorario} />
            <SituacaoPedidos porStatus={r.porStatus} pedidos={r.pedidos} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarrasRanking titulo="Por tipo de visitante" grupos={r.porTipoVisitante} corBarra="bg-turquesa-600" />
            <BarrasRanking titulo="Por faixa etária" grupos={r.porFaixaEtaria} corBarra="bg-oliva-600" />
          </div>
        </div>
      )}
    </div>
  )
}
