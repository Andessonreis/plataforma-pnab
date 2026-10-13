import type { Metadata } from 'next'
import { FormularioAgendamento } from '@/app/(public)/memorial/agendar/formulario-agendamento'
import { CabecalhoMemorial } from './cabecalho-memorial'

export const metadata: Metadata = { title: 'Agendar visita ao Memorial — Portal PNAB Irecê' }

export const dynamic = 'force-dynamic'

/**
 * Pedido de visita ao Memorial dentro da área do proponente. O formulário é o
 * mesmo da página pública; aqui ele vem pré-preenchido com os dados da conta
 * e o proponente não sai do menu lateral.
 */
export default function AgendarVisitaProponentePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <CabecalhoMemorial
        titulo="Agendar visita ao Memorial"
        texto="Escolas, grupos e famílias podem pedir um horário de visita mediada. O pedido só vale depois da confirmação da equipe."
        atalho={{ href: '/proponente/memorial/visitas', rotulo: 'Ver as visitas que já pedi' }}
      />
      <FormularioAgendamento destinoFinal={{ href: '/proponente/memorial/visitas', rotulo: 'Ver minhas visitas' }} />
    </div>
  )
}
