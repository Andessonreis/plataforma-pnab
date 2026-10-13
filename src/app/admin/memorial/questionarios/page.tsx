import type { Metadata } from 'next'
import Link from 'next/link'
import { IconClipboard, IconPlus, Pagination } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { listarQuestionariosSchema } from '@/lib/schemas/questionario'
import { requireRole } from '@/app/admin/require-role'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { CabecalhoPagina, VazioAcionavel, botaoPrimario } from '@/app/admin/memorial/_ui'
import { FiltroSituacao } from '@/app/admin/memorial/_ui/config-filtros'
import { CartaoQuestionario } from './_lista/cartao-questionario'
import { carregarLista } from './_lista/carregar-lista'
import { ModelosPartida } from './_lista/modelos-partida'

export const metadata: Metadata = {
  title: 'Questionários — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string; busca?: string }>
}

const BASE = '/admin/memorial/questionarios'

export default async function QuestionariosPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)

  const params = await searchParams
  const filtros = listarQuestionariosSchema.safeParse({
    page: params.page,
    pageSize: 12,
    status: params.status || undefined,
    busca: params.busca || undefined,
  })
  const consulta = filtros.success ? filtros.data : listarQuestionariosSchema.parse({ pageSize: 12 })
  const { questionarios, meta } = await carregarLista(consulta)
  const filtrando = Boolean(consulta.status || consulta.busca)

  return (
    <section>
      <CabecalhoPagina
        titulo="Questionários"
        descricao="Perguntas que o público responde pelo site. Mude quando quiser: cada resposta fica guardada com as perguntas da época em que foi enviada."
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
        acoes={
          <Link href={`${BASE}/novo`} className={botaoPrimario}>
            <IconPlus className="h-4 w-4" />
            Novo questionário
          </Link>
        }
      />
      <ModelosPartida />
      <FiltroSituacao base={BASE} status={consulta.status} busca={consulta.busca} nomeBusca="busca" placeholder="Buscar pelo título" />

      {questionarios.length === 0 ? (
        <VazioAcionavel
          icone={<IconClipboard className="h-6 w-6" />}
          titulo={filtrando ? 'Nenhum questionário com esse filtro' : 'Nenhum questionário ainda'}
          texto={filtrando ? 'Tente outra palavra ou escolha "Todas".' : 'Monte as perguntas, publique e envie o endereço. As respostas chegam aqui.'}
          acao={filtrando ? undefined : { href: `${BASE}/novo`, rotulo: 'Criar o primeiro' }}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {questionarios.map((q) => (
            <li key={q.id}>
              <CartaoQuestionario q={q} />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        baseUrl={montarUrl(BASE, { status: consulta.status, busca: consulta.busca })}
        className="mt-6"
      />
    </section>
  )
}
