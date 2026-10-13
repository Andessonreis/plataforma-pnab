'use client'

interface BotoesEtapaProps {
  aoVoltar?: () => void
  /** Sem `aoContinuar` o botão principal vira `submit` do formulário em volta. */
  aoContinuar?: () => void
  rotulo?: string
  carregando?: boolean
}

const FOCO = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700'

/** Rodapé de cada etapa. No celular o botão principal vem por cima e ocupa a largura toda. */
export function BotoesEtapa({ aoVoltar, aoContinuar, rotulo = 'Continuar', carregando }: BotoesEtapaProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      {aoVoltar ? (
        <button
          type="button"
          onClick={aoVoltar}
          className={`min-h-[48px] border-2 border-tinta-900/30 px-5 text-sm font-semibold text-tinta-800 hover:border-tinta-900 ${FOCO}`}
        >
          Voltar
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <button
        type={aoContinuar ? 'button' : 'submit'}
        onClick={aoContinuar}
        disabled={carregando}
        aria-busy={carregando || undefined}
        className={`min-h-[48px] bg-tinta-900 px-6 text-sm font-semibold text-papel-50 hover:bg-tinta-800 disabled:cursor-wait disabled:opacity-70 ${FOCO}`}
      >
        {carregando ? 'Enviando…' : rotulo}
      </button>
    </div>
  )
}
