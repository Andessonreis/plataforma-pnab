import type { BadgeVariant } from '@/components/ui/badge'
import type { BannerEditalProps } from './banner-edital'

/** Edital já normalizado para exibição na home (Decimal/Date resolvidos na page). */
export interface EditalResumo {
  id: string
  titulo: string
  slug: string
  categoria: string
  valor: string
  statusLabel: string
  statusVariant: BadgeVariant
  prazoLabel: string | null
}

interface SlideBase {
  id: string
  titulo: string
  subtitulo?: string
  ctaLabel: string
  ctaUrl: string
}

/**
 * Slide montado em componente — texto real, cores da paleta e conteúdo
 * ajustável sem depender de exportar arte nova.
 */
export interface SlideComposicao extends SlideBase {
  tipo: 'composicao'
  banner: BannerEditalProps
}

/** Slide de arte fechada enviada pela Secretaria (cadastrada no admin). */
export interface SlideArte extends SlideBase {
  tipo: 'arte'
  imagemUrl: string
}

export type SlideDestaque = SlideComposicao | SlideArte
