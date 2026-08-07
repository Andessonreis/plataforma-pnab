import type { EtapaCustomizada } from '@/types/etapa-customizada'

// Etapas do wizard de nova inscrição, na ordem em que podem aparecer.
export type Step =
  | { kind: 'categoria' }
  | { kind: 'dados' }
  | { kind: 'video' }
  | { kind: 'etapa_custom'; etapa: EtapaCustomizada }
  | { kind: 'anexos' }
  | { kind: 'revisao' }
