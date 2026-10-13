import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { ListaVisitas } from './lista-visitas'

export const metadata: Metadata = { title: 'Minhas visitas ao Memorial — Portal PNAB Irecê' }

const FOTOS = ['/images/cidade/panoramica-irece.jpg', '/images/secult/festa-irece.jpg']

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function MinhasVisitasPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const page = Math.max(1, Number((await searchParams).page) || 1)

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto compacto fotos={FOTOS} trilha="Minhas visitas" chamada="Memorial de Irecê" titulo="Minhas visitas" />

      <section aria-label="Visitas pedidas" className="papel-textura bg-papel-50 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <ListaVisitas
            userId={session.user.id}
            page={page}
            baseUrl="/memorial/agendar/minhas-visitas"
            agendarHref="/memorial/agendar"
          />
        </div>
      </section>
    </div>
  )
}
