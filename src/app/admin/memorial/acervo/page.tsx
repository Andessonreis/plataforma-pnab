import type { Metadata } from 'next'
import { Button, Card, IconPlus, Pagination } from '@/components/ui'
import { listagemAcervoAdminSchema } from '@/lib/schemas/memorial-acervo'
import { listarAdmin } from '@/lib/services/memorial-acervo.service'
import { opcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { requireRole } from '../../require-role'
import { CabecalhoAdmin } from '../_componentes/cabecalho-admin'
import { FiltrosLista } from '../_componentes/filtros-lista'
import { lerFiltros, montarUrl } from '../_componentes/parametros'
import { EnviarFotos } from './enviar-fotos'
import { FiltrosAcervo } from './filtros-acervo'
import { GradeAcervo } from './grade-acervo'

export const metadata: Metadata = { title: 'Acervo do Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

const BASE = '/admin/memorial/acervo'

export default async function AcervoAdminPage({ searchParams }: Props) {
  await requireRole('COMUNICACAO')
  const f = lerFiltros(listagemAcervoAdminSchema, { pageSize: '24', ...(await searchParams) })
  const [{ itens, total }, opcoes] = await Promise.all([listarAdmin(f), opcoesDeVinculo()])
  const filtrosUrl = { status: f.status, q: f.q, tipo: f.tipo, albumId: f.albumId, decada: f.decada }

  return (
    <section className="space-y-6">
      <CabecalhoAdmin
        titulo="Acervo e fotografias"
        descricao={`${total} ${total === 1 ? 'item' : 'itens'} no acervo. Fotos, documentos, objetos e depoimentos.`}
        voltar={{ href: '/admin/memorial', rotulo: 'Painel do Memorial' }}
      >
        <Button href={`${BASE}/albuns`} variant="outline" size="sm" className="min-h-[44px]">
          Álbuns
        </Button>
        <Button href={`${BASE}/novo`} size="sm" className="min-h-[44px]">
          <IconPlus className="mr-2 h-4 w-4" />
          Novo item
        </Button>
      </CabecalhoAdmin>

      <EnviarFotos albuns={opcoes.albuns} />

      <div>
        <FiltrosLista base={montarUrl(BASE, { tipo: f.tipo, albumId: f.albumId, decada: f.decada })} status={f.status} q={f.q} />
        <FiltrosAcervo f={f} albuns={opcoes.albuns} />
        {itens.length === 0 ? (
          <Card padding="sm" className="sm:p-8">
            <p className="text-center text-sm text-slate-600">Nenhum item com esses filtros.</p>
          </Card>
        ) : (
          <GradeAcervo itens={itens} />
        )}
        <Pagination currentPage={f.page} totalPages={Math.ceil(total / f.pageSize)} baseUrl={montarUrl(BASE, filtrosUrl)} className="mt-6" />
      </div>
    </section>
  )
}
