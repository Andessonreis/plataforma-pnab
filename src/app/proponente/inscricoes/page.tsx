import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Pagination } from '@/components/ui'
import { CabecalhoPagina } from '../_componentes/cabecalho-pagina'
import { botaoContorno } from '../estilos'
import { VazioPainel } from '../vazio-painel'
import { STATUS_BUCKETS, resolveBucketKey } from './status-buckets'
import { StatusTabs } from './status-tabs'
import { InscricaoItem } from './inscricao-item'
import { carregarInscricoes } from './inscricoes-data'
import { PASSOS_INSCRICOES } from './inscricoes-tour-steps'

export const metadata: Metadata = {
  title: 'Minhas Inscrições — Portal PNAB Irecê',
}

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

function textoEditaisAbertos(quantidade: number): string {
  if (quantidade === 0) return 'Quando a Secretaria abrir um edital, ele aparece na página de editais.'
  const sujeito = quantidade === 1 ? 'Há um edital com inscrições abertas' : `Há ${quantidade} editais com inscrições abertas`
  return `${sujeito}. Leia as regras e comece pelo formulário do edital: o rascunho fica salvo aqui.`
}

export default async function MinhasInscricoesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const bucketKey = resolveBucketKey(params.status)
  const dados = await carregarInscricoes(session.user.id, bucketKey, page)
  const baseUrl = bucketKey === 'todas' ? '/proponente/inscricoes' : `/proponente/inscricoes?status=${bucketKey}`

  return (
    <div className="mx-auto max-w-6xl">
      <CabecalhoPagina
        id="tour-inscricoes-header"
        titulo="Minhas inscrições"
        resumo="A situação de cada inscrição e o que falta você fazer."
        passosTour={PASSOS_INSCRICOES}
        acoes={
          dados.totalGeral > 0 && (
            <Link id="tour-inscricoes-nova" href="/editais" className={botaoContorno}>
              Ver editais
            </Link>
          )
        }
      />

      {dados.totalGeral === 0 ? (
        <div className="mt-10 max-w-2xl">
          <VazioPainel
            titulo="Você ainda não se inscreveu em nenhum edital."
            texto={textoEditaisAbertos(dados.editaisAbertos)}
            acao={{ href: '/editais', rotulo: dados.editaisAbertos > 0 ? 'Ver editais abertos' : 'Ver editais' }}
          />
        </div>
      ) : (
        <>
          <div id="tour-inscricoes-filtros" className="mt-8">
            <StatusTabs activeKey={bucketKey} contagemPorStatus={dados.contagemPorStatus} totalGeral={dados.totalGeral} />
          </div>

          {dados.fichas.length === 0 ? (
            <div className="mt-6">
              <VazioPainel
                titulo={`Nenhuma inscrição em "${STATUS_BUCKETS[bucketKey].label}".`}
                texto="Quando alguma inscrição chegar a essa situação, ela aparece neste filtro."
                acao={{ href: '/proponente/inscricoes', rotulo: 'Ver todas as inscrições' }}
              />
            </div>
          ) : (
            <ul id="tour-inscricoes-lista" aria-label="Inscrições" className="mt-2">
              {dados.fichas.map((inscricao, index) => (
                <InscricaoItem key={inscricao.id} inscricao={inscricao} destaqueTour={index === 0} />
              ))}
            </ul>
          )}

          <div id="tour-inscricoes-paginacao">
            <Pagination currentPage={page} totalPages={dados.totalPaginas} baseUrl={baseUrl} className="mt-8" />
          </div>
        </>
      )}
    </div>
  )
}
