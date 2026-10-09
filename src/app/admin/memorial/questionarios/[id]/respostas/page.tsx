import type { Metadata } from 'next'
import { IconClipboard, IconDownload, Pagination } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { paginationSchema } from '@/lib/schemas/pagination'
import { requireRole } from '@/app/admin/require-role'
import { montarUrl } from '@/app/admin/memorial/_componentes/parametros'
import { CabecalhoPagina, VazioAcionavel, botaoPrimario } from '@/app/admin/memorial/_ui'
import { carregarRespostas } from './carregar'
import { FiltroPeriodo } from './filtro-periodo'
import { periodoSchema } from './periodo'
import { RespostaCartao } from './resposta-cartao'
import { RespostasTabela } from './respostas-tabela'

export const metadata: Metadata = {
  title: 'Respostas do questionário — Portal PNAB Irecê',
}

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; de?: string; ate?: string }>
}

function textoTotal(total: number, totalGeral: number, filtrando: boolean) {
  const n = (x: number) => (x === 1 ? '1 resposta' : `${x} respostas`)
  return filtrando ? `${n(total)} no período escolhido, de ${totalGeral} no total.` : `${n(total)} recebidas, da mais nova para a mais antiga.`
}

export default async function RespostasPage({ params, searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const { id } = await params
  const busca = await searchParams
  const { page } = paginationSchema.catch({ page: 1, pageSize: 20 }).parse({ page: busca.page })
  const periodo = periodoSchema.parse(busca)
  const { questionario, data, total, totalGeral, totalPages } = await carregarRespostas(id, page, periodo)
  const base = `/admin/memorial/questionarios/${id}/respostas`
  const filtrando = Boolean(periodo.de || periodo.ate)

  return (
    <section>
      <CabecalhoPagina
        titulo={`Respostas: ${questionario.titulo}`}
        descricao={`${textoTotal(total, totalGeral, filtrando)} Cada uma aparece com as perguntas da versão em que foi enviada.`}
        voltar={{ href: `/admin/memorial/questionarios/${id}`, rotulo: 'Voltar ao questionário' }}
        acoes={
          totalGeral > 0 && (
            <a href={`/api/v1/questionarios/${id}/respostas?formato=csv`} download className={`${botaoPrimario} w-full sm:w-auto`}>
              <IconDownload className="h-4 w-4" />
              Baixar planilha com todas
            </a>
          )
        }
      />
      {totalGeral > 0 && <FiltroPeriodo base={base} periodo={periodo} />}
      {filtrando && totalGeral > 0 && (
        <p className="-mt-2 mb-4 text-sm text-tinta-600">A planilha sempre traz todas as respostas, sem o filtro de período.</p>
      )}

      {data.length === 0 ? (
        <VazioAcionavel
          icone={<IconClipboard className="h-6 w-6" />}
          titulo={filtrando ? 'Nenhuma resposta nesse período' : 'Nenhuma resposta ainda'}
          texto={
            filtrando
              ? 'Escolha outras datas ou veja todas.'
              : questionario.status === 'PUBLICADO'
                ? `Envie o endereço /questionarios/${questionario.slug} para começar a receber respostas.`
                : 'O questionário só recebe respostas depois de publicado.'
          }
          acao={filtrando ? { href: base, rotulo: 'Ver todas' } : undefined}
        />
      ) : (
        <>
          <ul className="space-y-3 sm:hidden">
            {data.map((r) => (
              <li key={r.id}>
                <RespostaCartao resposta={r} href={`${base}/${r.id}`} />
              </li>
            ))}
          </ul>
          <RespostasTabela respostas={data} base={base} />
          <Pagination currentPage={page} totalPages={totalPages} baseUrl={montarUrl(base, periodo)} className="mt-6" />
        </>
      )}
    </section>
  )
}
