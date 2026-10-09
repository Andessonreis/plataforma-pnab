import type { Metadata } from 'next'
import Link from 'next/link'
import { z } from 'zod'
import { IconDownload } from '@/components/ui'
import { requireRole } from '@/app/admin/require-role'
import { lerFiltros, montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { CabecalhoPagina, linkDiscreto } from '@/app/admin/memorial/_ui'
import { ehDiaValido } from '@/lib/memorial/agendamento/datas'
import { listarVisitasQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { ABAS_AGENDA, contarAbas } from '@/lib/services/memorial-agenda-abas.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { AbasAgenda, AlternarVisao } from './_componentes/abas-visao'
import { FiltrosVisitas } from './_componentes/filtros-visitas'
import { VisaoCalendario } from './_componentes/visao-calendario'
import { VisaoLista } from './_componentes/visao-lista'

export const metadata: Metadata = { title: 'Agenda de visitas do Memorial — Portal PNAB Irecê' }

const filtrosSchema = listarVisitasQuerySchema.extend({
  aba: z.enum(ABAS_AGENDA).default('responder'),
  visao: z.enum(['lista', 'calendario']).default('lista'),
  escala: z.enum(['mes', 'semana', 'dia']).default('semana'),
  ref: z.string().refine(ehDiaValido).optional(),
})

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AgendamentosPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const filtros = lerFiltros(filtrosSchema, await searchParams)
  const { aba, visao, escala, ref, status, busca, de, ate } = filtros
  const calendario = visao === 'calendario'
  const contagem = await contarAbas()

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        titulo="Agenda de visitas"
        descricao="Responda os pedidos de visita e acompanhe quem vem ao Memorial. O responsável recebe cada resposta por e-mail."
        acoes={<AlternarVisao visao={visao} busca={busca} />}
      />

      <nav aria-label="Outras telas da agenda" className="-mt-3 flex flex-wrap gap-x-5">
        <Link href="/admin/memorial/agendamentos/relatorio" className={`${linkDiscreto} py-2`}>
          Relatório de visitas
        </Link>
        <Link href="/admin/memorial/agendamentos/regulamento" className={`${linkDiscreto} py-2`}>
          Regulamento
        </Link>
        {/* Link comum, não <Link>: o prefetch do Next baixaria o CSV e gravaria a exportação na auditoria. */}
        <a
          href={montarUrl('/api/v1/memorial/agendamentos/exportar', { de, ate, status, busca })}
          className={`${linkDiscreto} inline-flex items-center gap-1.5 py-2`}
        >
          <IconDownload className="h-4 w-4" />
          Baixar planilha
        </a>
      </nav>

      {!calendario && <AbasAgenda ativa={aba} contagem={contagem} busca={busca} />}

      <FiltrosVisitas
        fixos={calendario ? { visao, escala, ref } : { aba }}
        status={status}
        busca={busca}
        de={de}
        ate={ate}
        comSituacao={calendario || aba === 'todas'}
        comPeriodo={!calendario}
      />

      {calendario ? (
        <VisaoCalendario escala={escala} referencia={ref} status={status} busca={busca} />
      ) : (
        <VisaoLista aba={aba} filtros={filtros} />
      )}
    </div>
  )
}
