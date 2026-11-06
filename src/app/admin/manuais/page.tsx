import type { Metadata } from 'next'
import { Button, Card, EmptyState, FilterTabs, IconBook, IconPlus, Pagination } from '@/components/ui'
import { ROLES_MANUAIS } from '@/lib/manuais/regras'
import { listagemManuaisSchema } from '@/lib/schemas/manual'
import { listarAdmin } from '@/lib/services/manual.service'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { ListaManuais } from './lista-manuais'

export const metadata: Metadata = { title: 'Manuais e Documentos — Portal PNAB Irecê' }

const BASE = '/admin/manuais'

const ABAS = [
  { key: '', label: 'Todos', href: BASE },
  { key: 'publicado', label: 'Publicados', href: `${BASE}?status=publicado` },
  { key: 'oculto', label: 'Ocultos', href: `${BASE}?status=oculto` },
]

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function AdminManuaisPage({ searchParams }: Props) {
  await requireRole(...ROLES_MANUAIS)
  const lido = listagemManuaisSchema.safeParse(await searchParams)
  const filtro = lido.success ? lido.data : listagemManuaisSchema.parse({})
  const { itens, total } = await listarAdmin(filtro)

  return (
    <section>
      <CabecalhoPagina
        titulo="Manuais e Documentos"
        descricao={`${total} documento(s). Os publicados aparecem na página pública de Manuais.`}
        acoes={
          <Button href={`${BASE}/novo`} size="sm" className="min-h-[44px]">
            <IconPlus className="mr-2 h-4 w-4" />
            Novo documento
          </Button>
        }
      />

      <div className="mb-4 overflow-x-auto sm:mb-6">
        <FilterTabs tabs={ABAS} activeKey={filtro.status ?? ''} ariaLabel="Filtrar por situação" />
      </div>

      {itens.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconBook className="h-8 w-8 text-slate-400" />}
            title="Nenhum documento"
            description="Cadastre um manual, guia ou modelo para os proponentes baixarem."
            action={{ label: 'Novo documento', href: `${BASE}/novo` }}
          />
        </Card>
      ) : (
        <>
          <ListaManuais manuais={itens} />
          <Pagination
            currentPage={filtro.page}
            totalPages={Math.ceil(total / filtro.pageSize)}
            baseUrl={filtro.status ? `${BASE}?status=${filtro.status}` : BASE}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
