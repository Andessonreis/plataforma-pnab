import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CategoriasManager } from './categorias-manager'

export const metadata: Metadata = {
  title: 'Categorias Culturais — Portal PNAB Irecê',
}

export default async function AdminCategoriasPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const categorias = await prisma.categoria.findMany({
    orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
  })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Categorias Culturais</h1>
        <p className="text-slate-600 mt-1">
          Gerencie as categorias disponíveis para os editais.
        </p>
      </div>

      <CategoriasManager initialData={categorias} />
    </section>
  )
}
