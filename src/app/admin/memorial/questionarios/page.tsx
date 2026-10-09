import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/app/admin/require-role'
import { listarQuestionariosSchema } from '@/lib/schemas/questionario'
import { listarQuestionarios } from '@/lib/services/questionario.service'
import { STATUS_CONTEUDO, ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { Button, Card, EmptyState, IconClipboard, IconPlus, Pagination } from '@/components/ui'
import { Cabecalho } from './cabecalho'
import { QuestionariosLista } from './questionarios-lista'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'

export const metadata: Metadata = {
  title: 'Questionários — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

const BASE = '/admin/memorial/questionarios'

export default async function QuestionariosPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)

  const params = await searchParams
  const filtros = listarQuestionariosSchema.safeParse({ page: params.page, pageSize: 12, status: params.status || undefined })
  const consulta = filtros.success ? filtros.data : listarQuestionariosSchema.parse({ pageSize: 12 })
  const { data, meta } = await listarQuestionarios(consulta)

  const filtrosStatus = [{ valor: '', rotulo: 'Todos' }, ...STATUS_CONTEUDO.map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] }))]
  const statusAtual = consulta.status ?? ''

  return (
    <section>
      <Cabecalho
        titulo="Questionários"
        descricao={`${meta.total} questionário(s). As perguntas podem mudar a qualquer momento; cada resposta guarda as perguntas da época em que foi enviada.`}
        acoes={
          <Button href={`${BASE}/novo`} size="sm">
            <IconPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Novo questionário
          </Button>
        }
      />

      <nav aria-label="Filtrar por situação" className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:mb-6 sm:px-0">
        <ul className="flex gap-2">
          {filtrosStatus.map((f) => (
            <li key={f.valor} className="shrink-0">
              <Link
                href={f.valor ? `${BASE}?status=${f.valor}` : BASE}
                aria-current={statusAtual === f.valor ? 'page' : undefined}
                className={[
                  'inline-flex min-h-[44px] items-center rounded-full px-4 text-xs font-medium transition-colors',
                  statusAtual === f.valor ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                ].join(' ')}
              >
                {f.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title={statusAtual ? 'Nenhum questionário nesta situação' : 'Nenhum questionário criado'}
            description="Monte as perguntas, publique e compartilhe o endereço. As respostas chegam aqui."
            action={{ label: 'Novo questionário', href: `${BASE}/novo` }}
          />
        </Card>
      ) : (
        <>
          <QuestionariosLista questionarios={data} />
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            baseUrl={statusAtual ? `${BASE}?status=${statusAtual}` : BASE}
            className="mt-4 sm:mt-6"
          />
        </>
      )}
    </section>
  )
}
