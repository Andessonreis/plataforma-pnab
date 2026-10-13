import type { regrasDeVisita } from '@/lib/memorial/texto-visita'

/** Conteúdo do convite do Memorial na home, já resolvido no servidor. */
export interface ConviteMemorial {
  titulo: string
  chamada: string
  texto: string
  regras: ReturnType<typeof regrasDeVisita>
  exposicoes: { slug: string; titulo: string; periodo: string | null; capaUrl: string | null }[]
  /** Até três próximos horários livres, ex.: "qua., 15/10 · 09:00". */
  proximos: string[]
  contatos: string[]
}
