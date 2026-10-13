import type { Metadata } from 'next'
import Link from 'next/link'
import { IconSlides, Pagination } from '@/components/ui'
import { ROLES_MEMORIAL } from '@/lib/memorial/acesso'
import { listagemAcervoAdminSchema } from '@/lib/schemas/memorial-acervo'
import { listarAdmin } from '@/lib/services/memorial-acervo.service'
import { contarConteudo, opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../require-role'
import { lerFiltros, montarUrl } from '../_componentes/parametros'
import { CabecalhoPagina, VazioAcionavel, botaoNeutro } from '../_ui'
import { AcervoAbasSituacao } from '../_ui/acervo-abas-situacao'
import { AcervoBusca } from '../_ui/acervo-busca'
import { AreaEnvio } from './_componentes/area-envio'
import { FiltrosAcervo } from './_componentes/filtros-acervo'
import { ParedeFotos } from './_componentes/parede-fotos'

export const metadata: Metadata = { title: 'Acervo do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const BASE = '/admin/memorial/acervo'

export default async function AcervoAdminPage({ searchParams }: Props) {
  await requireRole(...ROLES_MEMORIAL)
  const f = lerFiltros(listagemAcervoAdminSchema, { pageSize: '30', ...(await searchParams) })
  const [{ itens, total }, opcoes, contagens] = await Promise.all([listarAdmin(f), opcoesDeVinculo(), contarConteudo()])
  const recortes = { q: f.q, tipo: f.tipo, albumId: f.albumId, decada: f.decada }
  const filtrando = Boolean(f.q || f.tipo || f.albumId || f.decada)

  return (
    <section className="space-y-6">
      <CabecalhoPagina
        titulo="Acervo e fotografias"
        descricao="Envie fotos, complete crédito e autorização e acompanhe o que já está no site."
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
        acoes={
          <>
            <Link href={`${BASE}/albuns`} className={botaoNeutro}>
              Álbuns
            </Link>
            <Link href={`${BASE}/novo`} className={botaoNeutro}>
              Cadastrar um item
            </Link>
          </>
        }
      />

      <AreaEnvio albuns={opcoes.albuns} />

      <div className="space-y-4">
        <AcervoAbasSituacao base={montarUrl(BASE, recortes)} status={f.status} contagens={contagens.acervo} />
        <AcervoBusca acao={BASE} q={f.q} manter={{ status: f.status, tipo: f.tipo, albumId: f.albumId, decada: f.decada }} placeholder="Buscar por título, legenda ou etiqueta">
          <FiltrosAcervo f={f} albuns={opcoes.albuns} base={BASE} />
        </AcervoBusca>
        {filtrando && (
          <p className="text-sm text-tinta-700">
            {total} {total === 1 ? 'resultado' : 'resultados'}.{' '}
            <Link href={montarUrl(BASE, { status: f.status })} className="font-semibold text-brand-700 underline underline-offset-4">
              Limpar busca e filtros
            </Link>
          </p>
        )}

        {itens.length === 0 ? (
          <VazioAcionavel
            icone={<IconSlides className="h-6 w-6" />}
            titulo={filtrando || f.status ? 'Nada por aqui com esses filtros' : 'O acervo ainda está vazio'}
            texto={
              filtrando || f.status
                ? 'Troque de aba ou limpe a busca para ver as outras fotos.'
                : 'Use “Escolher fotos” acima para enviar as primeiras fotografias.'
            }
          />
        ) : (
          <ParedeFotos itens={itens} />
        )}
        <Pagination currentPage={f.page} totalPages={Math.ceil(total / f.pageSize)} baseUrl={montarUrl(BASE, { ...recortes, status: f.status })} className="mt-6" />
      </div>
    </section>
  )
}
