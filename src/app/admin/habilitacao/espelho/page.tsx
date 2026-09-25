import type { Metadata } from 'next'
import { EscolhaEspelho } from '@/components/espelho/escolha-espelho'

export const metadata: Metadata = {
  title: 'Ver como habilitador — Portal PNAB Irecê',
}

export default function EscolhaHabilitadorPage() {
  return <EscolhaEspelho papel="HABILITADOR" />
}
