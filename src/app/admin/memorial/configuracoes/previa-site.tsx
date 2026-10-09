import type { ReactNode } from 'react'

export const CONFIGURACOES = '/api/v1/memorial/configuracoes'

/**
 * Moldura da pré-visualização: mostra o trecho do site com as cores e a tipografia
 * reais do Memorial, atualizando enquanto se digita.
 */
export function PreviaSite({ children }: { children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200">
      <figcaption className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
        Como fica no site
      </figcaption>
      <div className="tema-secult font-questrial pointer-events-none select-none" inert>
        {children}
      </div>
    </figure>
  )
}
