import type { Metadata } from 'next'
import { Button, IconPlus } from '@/components/ui'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import { listarAdmin } from '@/lib/services/memorial-exposicao.service'
import { requireRole } from '../../require-role'
import { CabecalhoAdmin } from '../_componentes/cabecalho-admin'
import { FiltrosLista } from '../_componentes/filtros-lista'
import { ListaConteudo } from '../_componentes/lista-conteudo'
import { lerFiltros, montarUrl } from '../_componentes/parametros'

export const metadata: Metadata = { title: 'Exposições do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const BASE = '/admin/memorial/exposicoes'

export default async function ExposicoesAdminPage({ searchParams }: Props) {
  await requireRole('COMUNICACAO')
  const f = lerFiltros(listagemAdminSchema, await searchParams)
  const { itens, total } = await listarAdmin(f)

  return (
    <section>
      <CabecalhoAdmin
        titulo="Exposições"
        descricao={`${total} ${total === 1 ? 'exposição cadastrada' : 'exposições cadastradas'}.`}
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
      >
        <Button href={`${BASE}/novo`} size="sm" className="min-h-[44px]">
          <IconPlus className="mr-2 h-4 w-4" />
          Nova exposição
        </Button>
      </CabecalhoAdmin>

      <FiltrosLista base={BASE} status={f.status} q={f.q} />
      <ListaConteudo
        linhas={itens.map((e) => ({
          id: e.id,
          titulo: e.titulo,
          detalhe: e.subtitulo ?? e.periodo,
          status: e.status,
          atualizadoEm: e.updatedAt,
          href: `${BASE}/${e.id}`,
        }))}
        vazio={f.q || f.status ? 'Nenhuma exposição com esse filtro.' : 'Nenhuma exposição cadastrada. Comece pela primeira.'}
        pagina={f.page}
        totalPaginas={Math.ceil(total / f.pageSize)}
        baseUrl={montarUrl(BASE, { status: f.status, q: f.q })}
      />
    </section>
  )
}
