'use client'

interface EditalArquivoRemoveButtonProps {
  onClick: () => void
  ariaLabel: string
}

/** Botão de remoção compartilhado pelas listas de arquivos salvos e pendentes do edital. */
export function EditalArquivoRemoveButton({ onClick, ariaLabel }: EditalArquivoRemoveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 text-red-500 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] inline-flex items-center justify-center shrink-0"
      aria-label={ariaLabel}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  )
}
