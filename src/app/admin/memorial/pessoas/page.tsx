import type { Metadata } from 'next'
import { Button, FilterTabs, IconPlus } from '@/components/ui'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import * as eventos from '@/lib/services/memorial-evento.service'
import * as pessoas from '@/lib/services/memorial-pessoa.service'
import { requireRole } from '../../require-role'
import { CabecalhoAdmin } from '../_componentes/cabecalho-admin'
import { FiltrosLista } from '../_componentes/filtros-lista'
import { ListaConteudo } from '../_componentes/lista-conteudo'
import { lerFiltros, montarUrl } from '../_componentes/parametros'

export const metadata: Metadata = { title: 'Pessoas e eventos do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const BASE = '/admin/memorial/pessoas'

/** Pessoas e eventos históricos em abas: são cadastrados juntos e se relacionam o tempo todo. */
export default async function PessoasAdminPage({ searchParams }: Props) {
  await requireRole('COMUNICACAO')
  const busca = await searchParams
  const aba = busca.aba === 'eventos' ? 'eventos' : 'pessoas'
  const f = lerFiltros(listagemAdminSchema, busca)
  const base = aba === 'eventos' ? `${BASE}?aba=eventos` : BASE

  const linhas =
    aba === 'eventos'
      ? await eventos.listarAdmin(f).then(({ itens, total }) => ({
          total,
          linhas: itens.map((e) => ({
            id: e.id,
            titulo: e.titulo,
            detalhe: e.ano ? `${e.ano}${e.periodo ? ` · ${e.periodo}` : ''}` : (e.periodo ?? 'Sem ano definido'),
            status: e.status,
            atualizadoEm: e.updatedAt,
            href: `${BASE}/eventos/${e.id}`,
          })),
        }))
      : await pessoas.listarAdmin(f).then(({ itens, total }) => ({
          total,
          linhas: itens.map((p) => ({
            id: p.id,
            titulo: p.nome,
            detalhe: p.periodo,
            status: p.status,
            atualizadoEm: p.updatedAt,
            href: `${BASE}/${p.id}`,
          })),
        }))

  return (
    <section>
      <CabecalhoAdmin
        titulo="Pessoas e eventos"
        descricao="Personagens da memória de Irecê e os acontecimentos que formam a linha do tempo."
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
      >
        <Button href={aba === 'eventos' ? `${BASE}/eventos/novo` : `${BASE}/novo`} size="sm" className="min-h-[44px]">
          <IconPlus className="mr-2 h-4 w-4" />
          {aba === 'eventos' ? 'Novo evento' : 'Nova pessoa'}
        </Button>
      </CabecalhoAdmin>

      <div className="mb-5">
        <FilterTabs
          ariaLabel="Escolher lista"
          activeKey={aba}
          tabs={[
            { key: 'pessoas', label: 'Pessoas', href: BASE },
            { key: 'eventos', label: 'Eventos', href: `${BASE}?aba=eventos` },
          ]}
        />
      </div>

      <FiltrosLista base={base} status={f.status} q={f.q} />
      <ListaConteudo
        linhas={linhas.linhas}
        vazio={aba === 'eventos' ? 'Nenhum evento encontrado.' : 'Nenhuma pessoa encontrada.'}
        pagina={f.page}
        totalPaginas={Math.ceil(linhas.total / f.pageSize)}
        baseUrl={montarUrl(base, { status: f.status, q: f.q })}
      />
    </section>
  )
}
