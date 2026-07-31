import { FolhaDeRosto as Faixa } from '@/components/ui/folha-de-rosto'
import { IconeEdital, IconePrazo } from '@/components/ui/ornamentos/icones'

interface FolhaDeRostoProps {
  publicados: number
  abertos: number
  /** Menor prazo entre os editais abertos, para a chamada de urgência. */
  proximoEncerramento: { titulo: string; dias: number } | null
}

const FOTOS = [
  '/images/galeria/foto-05.png', // bandeirinhas e praça cheia
  '/images/galeria/foto-03.png', // arraiá no coreto
  '/images/cidade/panoramica-irece.jpg', // a cidade ao entardecer
]

/**
 * Abertura da seção de editais.
 *
 * A faixa carrega o que decide a visita: quantos editais estão abertos e
 * quanto tempo resta no mais próximo de fechar. Contagem de dias, e não data,
 * porque é o que faz a pessoa agir hoje.
 */
export function FolhaDeRosto({ publicados, abertos, proximoEncerramento }: FolhaDeRostoProps) {
  return (
    <Faixa
      fotos={FOTOS}
      trilha="Editais"
      chamada="Fomento à cultura"
      titulo="Editais da PNAB Irecê"
      apoio="Chamamentos públicos da Política Nacional Aldir Blanc no município. Cada edital traz prazo, valor e a íntegra do documento para leitura."
    >
      <div className="mt-8 flex max-w-xl flex-col gap-4 rounded-sm bg-tinta-950/85 p-5">
        <div className="flex items-center gap-4">
          <IconeEdital className="h-8 w-8 shrink-0 text-accent-400" />
          <p className="text-sm text-papel-100">
            <span className="font-rye text-2xl leading-none text-accent-300">{abertos}</span>{' '}
            {abertos === 1 ? 'edital aberto' : 'editais abertos'} de {publicados} publicados
          </p>
        </div>

        {proximoEncerramento && (
          <div className="flex items-center gap-4 border-t border-papel-100/15 pt-4">
            <IconePrazo className="h-8 w-8 shrink-0 text-accent-400" />
            <p className="text-sm leading-snug text-papel-100">
              O mais próximo de fechar encerra em{' '}
              <span className="font-rye text-lg leading-none text-accent-300">
                {proximoEncerramento.dias === 0
                  ? 'algumas horas'
                  : `${proximoEncerramento.dias} ${proximoEncerramento.dias === 1 ? 'dia' : 'dias'}`}
              </span>
            </p>
          </div>
        )}
      </div>
    </Faixa>
  )
}
