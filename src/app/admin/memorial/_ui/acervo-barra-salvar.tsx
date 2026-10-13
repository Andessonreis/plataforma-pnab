import type { Recado } from '../_componentes/use-envio'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { botaoPrimario } from './classes'

interface Props {
  rotulo: string
  enviando: boolean
  alteracoesPendentes: boolean
  recado: Recado
}

/**
 * Barra presa ao pé da tela: o botão de salvar fica sempre ao alcance do polegar
 * e avisa quando há alterações que ainda não foram gravadas.
 */
export function AcervoBarraSalvar({ rotulo, enviando, alteracoesPendentes, recado }: Props) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-tinta-900/10 bg-white/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-xl sm:border">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tinta-700" aria-live="polite">
          {alteracoesPendentes ? (
            <>
              <span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent-500" />
              Alterações ainda não salvas
            </>
          ) : (
            'Tudo salvo'
          )}
        </p>
        <button type="submit" className={botaoPrimario} disabled={enviando}>
          {enviando ? 'Salvando…' : rotulo}
        </button>
      </div>
      <div className="mt-2 empty:hidden">
        <RecadoEnvio recado={recado} />
      </div>
    </div>
  )
}
