import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PageHeader } from '@client/components/ui'
import { CategoriasManager } from './categorias-manager'

export const metadata: Metadata = {
  title: 'Categorias Culturais — Portal PNAB Irecê',
}

export default async function CategoriasPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const rawCategorias = await prisma.category.findMany({
    orderBy: { ordem: 'asc' },
  })

  // Serializar para o client component (Date → string)
  const categorias = rawCategorias.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias Culturais"
        subtitle="Gerencie as categorias disponíveis para os editais da plataforma."
        breadcrumbs={[
          { label: 'Configurações', href: '/admin/configuracoes' },
          { label: 'Categorias Culturais' },
        ]}
      />

      <CategoriasManager initialCategorias={categorias} />
    </div>
  )
}
