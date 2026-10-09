import type { Metadata } from 'next'
import Link from 'next/link'
import { IconPlus, IconSlides, Pagination } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { listagemAdminSchema } from '@/lib/schemas/memorial-comum'
import { listarAdmin } from '@/lib/services/memorial-exposicao.service'
import { contarConteudo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../require-role'
import { lerFiltros, montarUrl } from '../_componentes/parametros'
import { CabecalhoPagina, VazioAcionavel, botaoPrimario } from '../_ui'
import { AcervoAbasSituacao } from '../_ui/acervo-abas-situacao'
import { AcervoBusca } from '../_ui/acervo-busca'
import { CartaoExposicao } from './_componentes/cartao-exposicao'

export const metadata: Metadata = { title: 'Exposições do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const BASE = '/admin/memorial/exposicoes'

export default async function ExposicoesAdminPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const f = lerFiltros(listagemAdminSchema, await searchParams)
  const [{ itens, total }, contagens] = await Promise.all([listarAdmin(f), contarConteudo()])
  const filtrando = Boolean(f.q || f.status)

  return (
    <section className="space-y-5">
      <CabecalhoPagina
        titulo="Exposições"
        descricao="Cada exposição reúne texto, capa e fotos do acervo. Abra uma para ver como ela aparece no site."
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
        acoes={
          <Link href={`${BASE}/novo`} className={botaoPrimario}>
            <IconPlus className="h-4 w-4" />
            Nova exposição
          </Link>
        }
      />

      <AcervoAbasSituacao base={montarUrl(BASE, { q: f.q })} status={f.status} contagens={contagens.exposicoes} />
      <AcervoBusca acao={BASE} q={f.q} manter={{ status: f.status }} placeholder="Buscar pelo título ou texto" />

      {itens.length === 0 ? (
        <VazioAcionavel
          icone={<IconSlides className="h-6 w-6" />}
          titulo={filtrando ? 'Nenhuma exposição nesta busca' : 'Nenhuma exposição ainda'}
          texto={filtrando ? 'Troque de aba ou limpe a busca.' : 'Crie a primeira e escolha as fotos do acervo que fazem parte dela.'}
          acao={filtrando ? undefined : { href: `${BASE}/novo`, rotulo: 'Nova exposição' }}
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {itens.map((e) => (
            <li key={e.id}>
              <CartaoExposicao e={e} />
            </li>
          ))}
        </ul>
      )}
      <Pagination currentPage={f.page} totalPages={Math.ceil(total / f.pageSize)} baseUrl={montarUrl(BASE, { status: f.status, q: f.q })} />
    </section>
  )
}
