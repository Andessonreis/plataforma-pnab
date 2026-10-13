import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { FolhaDeRosto } from '@/components/ui/folha-de-rosto'
import { FormularioAgendamento } from './formulario-agendamento'

export const metadata: Metadata = {
  title: 'Agendar visita ao Memorial — Portal PNAB Irecê',
  description: 'Peça um horário para visitar o Memorial de Irecê com sua escola, grupo ou família.',
}

export const dynamic = 'force-dynamic'

const FOTOS = ['/images/secult/festa-irece.jpg', '/images/cidade/panoramica-irece.jpg', '/images/galeria/foto-03.png']

export default async function AgendarVisitaPage() {
  const session = await auth()

  return (
    <div className="tema-secult font-questrial">
      <FolhaDeRosto
        fotos={FOTOS}
        trilha="Agendar visita ao Memorial"
        chamada="Memorial de Irecê"
        titulo="Agendar uma visita"
        apoio="Escolas, grupos e famílias podem pedir um horário de visita mediada. O pedido só vale depois da confirmação da equipe."
      >
        {session?.user && (
          <Link
            href="/memorial/agendar/minhas-visitas"
            className="inline-flex min-h-[44px] items-center text-sm text-papel-50 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-papel-50"
          >
            Ver as visitas que já pedi
          </Link>
        )}
      </FolhaDeRosto>

      <section aria-label="Pedido de visita" className="papel-textura bg-papel-50 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FormularioAgendamento />
        </div>
      </section>
    </div>
  )
}
