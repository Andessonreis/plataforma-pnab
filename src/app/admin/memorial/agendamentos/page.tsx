import type { Metadata } from 'next'
import { z } from 'zod'
import { Button, IconDownload } from '@/components/ui'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoAdmin } from '@/app/admin/memorial/_componentes/cabecalho-admin'
import { lerFiltros, montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { ehDiaValido } from '@/lib/memorial/agendamento/datas'
import { listarVisitasQuerySchema } from '@/lib/schemas/memorial-agendamento'
import { AbasVisao } from './_componentes/abas-visao'
import { FiltrosVisitas } from './_componentes/filtros-visitas'
import { VisaoCalendario } from './_componentes/visao-calendario'
import { VisaoLista } from './_componentes/visao-lista'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = { title: 'Agendamentos do Memorial — Portal PNAB Irecê' }

const filtrosSchema = listarVisitasQuerySchema.extend({
  visao: z.enum(['lista', 'calendario']).default('lista'),
  escala: z.enum(['mes', 'semana', 'dia']).default('mes'),
  ref: z.string().refine(ehDiaValido).optional(),
})

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AgendamentosPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const filtros = lerFiltros(filtrosSchema, await searchParams)
  const { visao, escala, ref, status, busca, de, ate } = filtros

  return (
    <section>
      <CabecalhoAdmin
        titulo="Agendamentos de visitas"
        descricao="Pedidos de visita ao Memorial. Confirme ou recuse cada um; o responsável recebe a resposta por e-mail."
      >
        <Button href="/admin/memorial/agendamentos/relatorio" variant="ghost" size="sm">
          Relatório
        </Button>
        <Button href="/admin/memorial/agendamentos/regulamento" variant="ghost" size="sm">
          Regulamento
        </Button>
        {/* Link comum, não <Link>: o prefetch do Next baixaria o CSV e gravaria a exportação na auditoria. */}
        <a
          href={montarUrl('/api/v1/memorial/agendamentos/exportar', { de, ate, status, busca })}
          className="inline-flex min-h-[44px] items-center rounded-md border-2 border-brand-600 px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <IconDownload className="mr-1.5 h-4 w-4" />
          Exportar CSV
        </a>
      </CabecalhoAdmin>

      <AbasVisao visao={visao} escala={escala} status={status} busca={busca} />
      <FiltrosVisitas
        fixos={visao === 'calendario' ? { visao, escala, ref } : {}}
        status={status}
        busca={busca}
        de={de}
        ate={ate}
        comPeriodo={visao === 'lista'}
      />

      {visao === 'calendario' ? (
        <VisaoCalendario escala={escala} referencia={ref} status={status} busca={busca} />
      ) : (
        <VisaoLista filtros={filtros} />
      )}
    </section>
  )
}
