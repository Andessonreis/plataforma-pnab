import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/app/admin/require-role'
import { paginationSchema } from '@/lib/schemas/pagination'
import { ServiceError } from '@/lib/services/errors'
import { obterQuestionario } from '@/lib/services/questionario.service'
import { listarRespostas } from '@/lib/services/questionario-resposta.service'
import { Card, EmptyState, IconClipboard, IconDownload, Pagination } from '@/components/ui'
import { Cabecalho } from '../../cabecalho'
import { RespostasTabela } from './respostas-tabela'
import { RespostaCartao } from './resposta-cartao'

export const metadata: Metadata = {
  title: 'Respostas do questionário — Portal PNAB Irecê',
}

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

async function carregar(id: string, page: number) {
  try {
    return await Promise.all([obterQuestionario(id), listarRespostas(id, page, 20)])
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'NOT_FOUND') notFound()
    throw err
  }
}

export default async function RespostasPage({ params, searchParams }: Props) {
  await requireRole('COMUNICACAO')
  const { id } = await params
  const { page } = paginationSchema.catch({ page: 1, pageSize: 20 }).parse({ page: (await searchParams).page })
  const [questionario, { data, meta }] = await carregar(id, page)
  const base = `/admin/memorial/questionarios/${id}`

  return (
    <section>
      <Cabecalho
        titulo="Respostas"
        voltar={{ href: base, rotulo: questionario.titulo }}
        descricao={`${meta.total} resposta(s). Cada uma aparece com as perguntas da versão em que foi enviada.`}
        acoes={
          meta.total > 0 ? (
            <a
              href={`/api/v1/questionarios/${id}/respostas?formato=csv`}
              download
              className="inline-flex min-h-[44px] items-center rounded-lg border-2 border-brand-600 px-4 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <IconDownload className="mr-2 h-4 w-4" aria-hidden="true" />
              Baixar planilha (CSV)
            </a>
          ) : null
        }
      />

      {data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconClipboard className="h-8 w-8 text-slate-400" />}
            title="Nenhuma resposta ainda"
            description={
              questionario.status === 'PUBLICADO'
                ? `Compartilhe o endereço /questionarios/${questionario.slug} para receber respostas.`
                : 'O questionário só recebe respostas depois de publicado.'
            }
          />
        </Card>
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {data.map((r) => (
              <li key={r.id}>
                <RespostaCartao resposta={r} />
              </li>
            ))}
          </ul>
          <RespostasTabela respostas={data} />
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} baseUrl={`${base}/respostas`} className="mt-4 sm:mt-6" />
        </>
      )}
    </section>
  )
}
