import type { EtapaCustomizada } from '@shared/types/etapa-customizada'

export interface Props {
  value: EtapaCustomizada[]
  onChange: (next: EtapaCustomizada[]) => void
}
