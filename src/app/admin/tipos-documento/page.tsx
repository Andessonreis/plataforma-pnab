import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { TiposDocumentoManager } from './tipos-documento-manager'

export const metadata: Metadata = {
  title: 'Tipos de Documento — Portal PNAB Irecê',
}

export default async function AdminTiposDocumentoPage() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const tipos = await prisma.tipoDocumento.findMany({
    orderBy: [{ escopo: 'asc' }, { ordem: 'asc' }, { label: 'asc' }],
  })

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tipos de Documento</h1>
        <p className="text-slate-600 mt-1">
          Gerencie os tipos de arquivo disponíveis para editais e inscrições.
        </p>
      </div>

      <TiposDocumentoManager initialData={tipos} />
    </section>
  )
}
