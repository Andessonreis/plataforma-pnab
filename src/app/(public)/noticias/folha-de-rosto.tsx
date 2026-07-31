import { FolhaDeRosto as Faixa } from '@/components/ui/folha-de-rosto'

interface FolhaDeRostoProps {
  total: number
  ultimaPublicacao: string | null
}

const FOTOS = [
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/galeria/foto-04.png', // fogueira do São João
]

/**
 * Abertura do noticiário.
 *
 * A data da última publicação vale mais do que a contagem total: numa página
 * de notícias, o que a pessoa quer saber ao chegar é se há coisa nova, não
 * quantas existem no arquivo.
 */
export function FolhaDeRosto({ total, ultimaPublicacao }: FolhaDeRostoProps) {
  return (
    <Faixa
      fotos={FOTOS}
      trilha="Notícias"
      chamada="O que anda acontecendo"
      titulo="Notícias"
      apoio="Editais, resultados, eventos e o que mais movimenta a cultura de Irecê."
    >
      {ultimaPublicacao && (
        <p className="mt-8 border-t border-papel-100/20 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
          Última publicação em <span className="text-accent-300">{ultimaPublicacao}</span>
          <span className="px-2 text-papel-200/40" aria-hidden="true">
            ·
          </span>
          {total} no arquivo
        </p>
      )}
    </Faixa>
  )
}
