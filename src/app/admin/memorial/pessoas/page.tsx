import type { Metadata } from 'next'
import Link from 'next/link'
import { IconCalendar, IconPlus, IconUsers, Pagination } from '@/components/ui'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import * as eventos from '@/lib/services/memorial-evento.service'
import * as pessoas from '@/lib/services/memorial-pessoa.service'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { requireRole } from '@/app/admin/require-role'
import { lerFiltros, montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { CabecalhoPagina, VazioAcionavel, botaoPrimario } from '@/app/admin/memorial/_ui'
import { AbasLink } from '@/app/admin/memorial/_ui/config-abas'
import { FiltroSituacao } from '@/app/admin/memorial/_ui/config-filtros'
import { GradePessoas } from './_lista/grade-pessoas'
import { LinhaDoTempo } from './_lista/linha-do-tempo'

export const metadata: Metadata = { title: 'Pessoas e eventos do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const BASE = '/admin/memorial/pessoas'
const BASE_EVENTOS = `${BASE}?aba=eventos`

/** Pessoas e eventos na mesma tela: um se liga ao outro o tempo todo. */
export default async function PessoasAdminPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const busca = await searchParams
  const naAbaEventos = busca.aba === 'eventos'
  // A linha do tempo precisa de muitos anos à vista; a grade de pessoas pagina em 12
  const f = lerFiltros(listagemAdminSchema, { pageSize: naAbaEventos ? '50' : '12', ...busca })
  const base = naAbaEventos ? BASE_EVENTOS : BASE

  const [listaPessoas, listaEventos] = await Promise.all([
    pessoas.listarAdmin(naAbaEventos ? { page: 1, pageSize: 1 } : f),
    eventos.listarAdmin(naAbaEventos ? f : { page: 1, pageSize: 1 }),
  ])
  const total = naAbaEventos ? listaEventos.total : listaPessoas.total
  const filtrando = Boolean(f.q || f.status)

  return (
    <section>
      <CabecalhoPagina
        titulo="Pessoas e eventos"
        descricao="Quem fez a história de Irecê e os acontecimentos que formam a linha do tempo do Memorial."
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
        acoes={
          <Link href={naAbaEventos ? `${BASE}/eventos/novo` : `${BASE}/novo`} className={botaoPrimario}>
            <IconPlus className="h-4 w-4" />
            {naAbaEventos ? 'Novo evento' : 'Nova pessoa'}
          </Link>
        }
      />

      <AbasLink
        rotulo="Escolher lista"
        ativa={naAbaEventos ? 'eventos' : 'pessoas'}
        abas={[
          { chave: 'pessoas', rotulo: 'Pessoas', href: BASE, contagem: listaPessoas.total },
          { chave: 'eventos', rotulo: 'Eventos', href: BASE_EVENTOS, contagem: listaEventos.total },
        ]}
      />
      <div className="mt-5">
        <FiltroSituacao base={base} status={f.status} busca={f.q} placeholder={naAbaEventos ? 'Buscar evento' : 'Buscar pessoa'} />
      </div>

      {total === 0 ? (
        <VazioAcionavel
          icone={naAbaEventos ? <IconCalendar className="h-6 w-6" /> : <IconUsers className="h-6 w-6" />}
          titulo={filtrando ? 'Nada encontrado com esse filtro' : naAbaEventos ? 'Nenhum evento cadastrado' : 'Nenhuma pessoa cadastrada'}
          texto={
            filtrando
              ? 'Tente outra palavra ou escolha "Todas" nas situações.'
              : naAbaEventos
                ? 'Cada evento com ano vira um ponto na linha do tempo do site.'
                : 'Cadastre quem marcou a história da cidade; a biografia aparece no site depois de aprovada.'
          }
          acao={filtrando ? undefined : { href: naAbaEventos ? `${BASE}/eventos/novo` : `${BASE}/novo`, rotulo: naAbaEventos ? 'Cadastrar evento' : 'Cadastrar pessoa' }}
        />
      ) : naAbaEventos ? (
        <LinhaDoTempo eventos={listaEventos.itens} />
      ) : (
        <GradePessoas pessoas={listaPessoas.itens} />
      )}

      <Pagination
        currentPage={f.page}
        totalPages={Math.ceil(total / f.pageSize)}
        baseUrl={montarUrl(base, { status: f.status, q: f.q })}
        className="mt-6"
      />
    </section>
  )
}
