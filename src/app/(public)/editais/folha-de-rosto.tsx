import { FolhaDeRosto as Faixa } from '@/components/ui/folha-de-rosto'
import { IconePrazo } from '@/components/ui/ornamentos/icones'

interface FolhaDeRostoProps {
  /** Menor prazo entre os editais abertos, para a chamada de urgência. */
  proximoEncerramento: { titulo: string; dias: number } | null
}

/** Dias restantes a partir dos quais o prazo mais próximo vira chamada na capa. */
const LIMITE_URGENCIA_DIAS = 7

const FOTOS = [
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
]

/**
 * Abertura da seção de editais.
 *
 * As contagens de abertos/publicados saíram daqui para a faixa de expediente
 * logo abaixo — a capa não é lugar de placar, é lugar de abertura de
 * capítulo. O que resta na capa é só a urgência real: um chip de uma linha
 * quando o prazo mais próximo já está apertado, e nada quando não está.
 */
export function FolhaDeRosto({ proximoEncerramento }: FolhaDeRostoProps) {
  const urgente = proximoEncerramento !== null && proximoEncerramento.dias <= LIMITE_URGENCIA_DIAS

  return (
    <Faixa
      fotos={FOTOS}
      trilha="Editais"
      chamada="Fomento à cultura"
      titulo="Editais da PNAB Irecê"
      apoio="Chamamentos públicos da Política Nacional Aldir Blanc no município. Cada edital traz prazo, valor e a íntegra do documento para leitura."
    >
      {urgente && (
        <p className="mt-6 inline-flex items-center gap-2 border border-accent-400/60 bg-tinta-950/70 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-accent-300">
          <IconePrazo className="h-4 w-4 shrink-0" aria-hidden="true" />
          {proximoEncerramento!.titulo} fecha em{' '}
          {proximoEncerramento!.dias === 0
            ? 'algumas horas'
            : `${proximoEncerramento!.dias} ${proximoEncerramento!.dias === 1 ? 'dia' : 'dias'}`}
        </p>
      )}
    </Faixa>
  )
}
