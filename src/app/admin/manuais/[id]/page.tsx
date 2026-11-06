import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ENDPOINT_MANUAIS, ROLES_MANUAIS } from '@/lib/manuais/regras'
import { categorias, obter } from '@/lib/services/manual.service'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { BotaoExcluir } from '@/app/admin/memorial/_componentes/botao-excluir'
import { ManualForm } from '../manual-form'

export const metadata: Metadata = { title: 'Editar documento — Portal PNAB Irecê' }

export default async function EditarManualPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(...ROLES_MANUAIS)
  const { id } = await params
  const [manual, sugestoes] = await Promise.all([obter(id).catch(() => null), categorias()])
  if (!manual) notFound()

  return (
    <section>
      <CabecalhoPagina
        titulo={manual.titulo}
        descricao="Alterações salvas aparecem na página pública na hora."
        voltar={{ href: '/admin/manuais', rotulo: 'Manuais e Documentos' }}
        acoes={
          <BotaoExcluir
            endpoint={`${ENDPOINT_MANUAIS}/${id}`}
            nome={manual.titulo}
            destino="/admin/manuais"
            aviso="O arquivo também é apagado e o documento sai da página pública."
          />
        }
      />
      <div className="max-w-3xl">
        <ManualForm manual={manual} categorias={sugestoes} />
      </div>
    </section>
  )
}
