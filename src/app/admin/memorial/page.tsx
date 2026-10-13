import type { Metadata } from 'next'
import Link from 'next/link'
import { buscarNoMemorial } from '@/lib/services/memorial-busca.service'
import { contarConteudo } from '@/lib/services/memorial-painel.service'
import {
  exposicoesNoAr,
  fotosRecentes,
  pedidosParaResponder,
  proximosSeteDias,
} from '@/lib/services/memorial-painel-visao.service'
import { FUSO_MEMORIAL } from '@/lib/memorial/agendamento/datas'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { BlocoSecao, linkDiscreto } from '@/app/admin/memorial/_ui'
import { SemanaVisitas } from '@/app/admin/memorial/_ui/agenda-semana'
import { requireRole } from '../require-role'
import { ResultadoBusca } from './_componentes/resultado-busca'
import { VisaoTopo } from './_componentes/visao-topo'
import { VisaoPendencias } from './_componentes/visao-pendencias'
import { VisaoFotos } from './_componentes/visao-fotos'
import { VisaoExposicoes } from './_componentes/visao-exposicoes'
import { resumoDoDia, tarefasDeConteudo } from './_componentes/visao-dados'

export const metadata: Metadata = { title: 'Memorial de Irecê — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<{ q?: string }>
}

const AGENDA = '/admin/memorial/agendamentos'

/** Visão geral do Memorial: o que pede resposta, a semana de visitas, o acervo e o que está no ar. */
export default async function PainelMemorialPage({ searchParams }: Props) {
  const sessao = await requireRole(...ROLES_MEMORIAL)
  const termo = (await searchParams).q?.trim().slice(0, 100) ?? ''
  const agora = new Date()
  const [pedidos, semana, contagens, fotos, exposicoes, resultado] = await Promise.all([
    pedidosParaResponder(),
    proximosSeteDias(agora),
    contarConteudo(),
    fotosRecentes(7),
    exposicoesNoAr(),
    termo.length >= 2 ? buscarNoMemorial(termo) : Promise.resolve(null),
  ])

  const hora = Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: FUSO_MEMORIAL }).format(agora))
  const deHoje = semana.dias[0].visitas.filter((v) => v.status === 'CONFIRMADO' || v.status === 'REALIZADO')
  const resumo = resumoDoDia(pedidos.total, deHoje.length, deHoje.reduce((s, v) => s + v.quantidade, 0))

  return (
    <div className="space-y-8">
      <VisaoTopo nome={sessao.user.name ?? ''} hoje={semana.hoje} hora={hora} termo={termo} resumo={resumo} />

      {resultado && (
        <section aria-labelledby="busca-titulo" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="busca-titulo" className="text-base font-bold text-tinta-900">
              Resultado para “{termo}”
            </h2>
            <Link href="/admin/memorial" className={`${linkDiscreto} py-2`}>
              Limpar busca
            </Link>
          </div>
          <ResultadoBusca termo={termo} resultado={resultado} />
        </section>
      )}

      <VisaoPendencias pedidos={pedidos} tarefas={tarefasDeConteudo(contagens)} hoje={semana.hoje} />

      <BlocoSecao titulo="Próximos 7 dias" verTudo={{ href: `${AGENDA}?visao=calendario&escala=semana`, rotulo: 'Abrir a agenda' }}>
        <SemanaVisitas
          dias={semana.dias}
          hoje={semana.hoje}
          urlDoDia={(dia) => `${AGENDA}?visao=calendario&escala=dia&ref=${dia}`}
        />
      </BlocoSecao>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <VisaoFotos fotos={fotos} />
        <VisaoExposicoes exposicoes={exposicoes} />
      </div>
    </div>
  )
}
