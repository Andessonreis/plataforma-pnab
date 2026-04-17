import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/ui'
import { TiposAnexoManager } from './tipos-anexo-manager'

export const metadata: Metadata = {
  title: 'Tipos de Anexo — Cultura e Turismo Irecê',
}

export default async function TiposAnexoPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const rawTipos = await prisma.attachmentType.findMany({
    orderBy: [{ tag: 'asc' }, { isSystem: 'desc' }, { label: 'asc' }],
  })

  // Serializar para o client component (Date → string)
  const tipos = rawTipos.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  // Tags únicas
  const tags = [...new Set(rawTipos.map(t => t.tag))].sort()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Anexo"
        subtitle="Gerencie os tipos de documentos dos editais e os anexos que proponentes enviam nas inscrições."
        breadcrumbs={[
          { label: 'Configurações', href: '/admin/configuracoes' },
          { label: 'Tipos de Anexo' },
        ]}
      />

      <TiposAnexoManager
        initialTipos={tipos}
        initialTags={tags}
      />
    </div>
  )
}
