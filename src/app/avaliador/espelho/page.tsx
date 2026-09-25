import type { Metadata } from 'next'
import { EscolhaEspelho } from '@/components/espelho/escolha-espelho'

export const metadata: Metadata = {
  title: 'Ver como avaliador — Portal PNAB Irecê',
}

export default function EscolhaAvaliadorPage() {
  return <EscolhaEspelho papel="AVALIADOR" />
}
