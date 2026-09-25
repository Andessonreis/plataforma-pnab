import type { ReactNode } from 'react'

/**
 * Deixa o formulário visível, como o avaliador o vê, mas sem como usá-lo.
 * `inert` tira clique e foco da subárvore inteira e o `fieldset disabled`
 * garante o mesmo para teclado e leitor de tela, então nenhum envio parte
 * do modo espelho.
 */
export function SomenteLeitura({ ativo, children }: { ativo: boolean; children: ReactNode }) {
  if (!ativo) return <>{children}</>

  return (
    <fieldset disabled inert className="m-0 min-w-0 border-0 p-0 opacity-70">
      {children}
    </fieldset>
  )
}
