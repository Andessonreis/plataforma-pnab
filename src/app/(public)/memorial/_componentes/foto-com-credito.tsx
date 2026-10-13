import Link from 'next/link'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'

export interface FotoPublica {
  id: string
  titulo: string
  legenda: string | null
  credito: string | null
  dataAproximada: string | null
  decada: number | null
  src: string
}

interface FotoComCreditoProps {
  foto: FotoPublica
  sizes: string
  /** Proporção do recorte. A galeria usa 4:3; destaques podem pedir retrato. */
  proporcao?: string
  href?: string
}

/**
 * Fotografia como cópia em papel: margem clara em volta, legenda embaixo e crédito
 * sempre visível. O crédito não é detalhe — é condição para a foto estar publicada.
 */
export function FotoComCredito({ foto, sizes, proporcao = 'aspect-[4/3]', href }: FotoComCreditoProps) {
  const quando = foto.dataAproximada ?? (foto.decada ? `Anos ${foto.decada}` : null)
  const imagem = (
    <div className={`relative overflow-hidden bg-tinta-900/10 ${proporcao}`}>
      <ImagemMemorial src={foto.src} alt={foto.legenda ?? foto.titulo} sizes={sizes} />
    </div>
  )

  return (
    <figure className="bg-white p-2 pb-3 shadow-[0_1px_3px_rgba(41,23,11,0.18)] sm:p-3 sm:pb-4">
      {href ? (
        <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          {imagem}
        </Link>
      ) : (
        imagem
      )}
      <figcaption className="mt-3 space-y-1 px-1">
        <span className="block text-sm font-semibold leading-snug text-tinta-900">{foto.titulo}</span>
        {quando && <span className="block text-xs text-tinta-600">{quando}</span>}
        {foto.credito && <span className="block text-xs text-tinta-500">Foto: {foto.credito}</span>}
      </figcaption>
    </figure>
  )
}
