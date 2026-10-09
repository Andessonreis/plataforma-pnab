import Image from 'next/image'
import { imagemExterna } from './tipos'

/**
 * Ruído de grão de filme (turbulência fractal) embutido, sem requisição extra.
 * `stitchTiles` evita a costura visível quando o padrão se repete.
 */
const GRAO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * Fundo da peça editorial: a fotografia vira lembrança — sépia, banho de
 * terracota, grão e vinheta. O tratamento é o mesmo para qualquer imagem
 * enviada no admin, o que mantém as peças com cara de uma família só. A tinta pesa mais à esquerda, onde mora o texto,
 * e deixa a foto respirar à direita; no celular o texto ocupa a largura toda,
 * então a tinta desce de cima para baixo.
 *
 * Decorativo (`aria-hidden`): o que importa para quem lê por leitor de tela
 * está no texto da peça.
 */
export function FundoPeca({ src }: { src: string }) {
  if (!src) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        unoptimized={imagemExterna(src)}
        sizes="100vw"
        priority
        className="object-cover [filter:sepia(0.9)_contrast(1.05)_brightness(0.8)]"
      />
      <div className="absolute inset-0 bg-brand-600/40 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-b from-tinta-950/85 via-tinta-950/70 to-tinta-950/90 lg:bg-gradient-to-r lg:from-tinta-950/95 lg:via-tinta-950/65 lg:to-tinta-950/25" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(20,10,5,0.55)_100%)]" />
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{ backgroundImage: GRAO }}
      />
    </div>
  )
}
