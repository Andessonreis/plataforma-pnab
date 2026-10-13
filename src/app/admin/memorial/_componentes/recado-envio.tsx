import { Aviso } from '@/components/ui'
import type { Recado } from './use-envio'

export function RecadoEnvio({ recado }: { recado: Recado }) {
  if (!recado) return null
  return <Aviso tom={recado.tom}>{recado.texto}</Aviso>
}
