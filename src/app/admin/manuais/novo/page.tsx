import type { Metadata } from 'next'
import { ROLES_MANUAIS } from '@/lib/manuais/regras'
import { categorias } from '@/lib/services/manual.service'
import { requireRole } from '@/app/admin/require-role'
import { CabecalhoPagina } from '@/app/admin/memorial/_ui'
import { ManualForm } from '../manual-form'

export const metadata: Metadata = { title: 'Novo documento — Portal PNAB Irecê' }

export default async function NovoManualPage() {
  await requireRole(...ROLES_MANUAIS)

  return (
    <section>
      <CabecalhoPagina
        titulo="Novo documento"
        descricao="Envie o arquivo e preencha os dados. Publicado, ele aparece na página de Manuais."
        voltar={{ href: '/admin/manuais', rotulo: 'Manuais e Documentos' }}
      />
      <div className="max-w-3xl">
        <ManualForm categorias={await categorias()} />
      </div>
    </section>
  )
}
