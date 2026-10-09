import type { FormEvent, ReactNode } from 'react'
import { IconEye } from '@/components/ui'

export const CONFIGURACOES = '/api/v1/memorial/configuracoes'

/**
 * Moldura da prévia: o trecho do site com as cores e a tipografia reais do
 * Memorial, atualizando enquanto se digita. Não é clicável.
 */
export function PreviaSite({ children }: { children: ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-tinta-900/15 bg-white">
      <figcaption className="flex items-center gap-2 border-b border-tinta-900/10 bg-papel-100 px-3 py-2 text-sm font-semibold text-tinta-800">
        <IconEye className="h-4 w-4" />
        Como aparece no site
      </figcaption>
      <div className="tema-secult font-questrial pointer-events-none select-none" inert>
        {children}
      </div>
    </figure>
  )
}

interface SecaoConfigProps {
  titulo: string
  /** Para que serve a seção, em uma frase. */
  explicacao: string
  onSubmit: (e: FormEvent) => void
  /** Campos e barra de salvar. */
  children: ReactNode
  previa: ReactNode
  /** Trechos largos do site (faixas de largura inteira) ficam abaixo do formulário, não ao lado. */
  previaLarga?: boolean
}

/** Uma seção de "Textos e regras": formulário à esquerda e, ao lado (abaixo no celular), a prévia do site. */
export function SecaoConfig({ titulo, explicacao, onSubmit, children, previa, previaLarga }: SecaoConfigProps) {
  return (
    <div className={`grid grid-cols-1 gap-6 ${previaLarga ? '' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]'}`}>
      <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-xl border border-tinta-900/10 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-tinta-900">{titulo}</h2>
          <p className="mt-1 text-sm text-tinta-600">{explicacao}</p>
        </div>
        {children}
      </form>
      <div className={previaLarga ? '' : 'lg:sticky lg:top-6'}>
        <PreviaSite>{previa}</PreviaSite>
      </div>
    </div>
  )
}
