import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ListaVisitas } from '@/app/(public)/memorial/agendar/minhas-visitas/lista-visitas'
import { CabecalhoMemorial } from '../cabecalho-memorial'

export const metadata: Metadata = { title: 'Minhas visitas ao Memorial — Portal PNAB Irecê' }

interface Props {
  searchParams: Promise<{ page?: string }>
}

/** Visitas ao Memorial pedidas pela conta, dentro da área do proponente. */
export default async function MinhasVisitasProponentePage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const page = Math.max(1, Number((await searchParams).page) || 1)

  return (
    <div className="mx-auto max-w-3xl">
      <CabecalhoMemorial
        titulo="Minhas visitas"
        texto="Os pedidos de visita feitos com esta conta e a resposta da equipe do Memorial."
        atalho={{ href: '/proponente/memorial', rotulo: 'Agendar uma visita' }}
      />
      <ListaVisitas
        userId={session.user.id}
        page={page}
        baseUrl="/proponente/memorial/visitas"
        agendarHref="/proponente/memorial"
      />
    </div>
  )
}
