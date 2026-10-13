import type { ReactNode } from 'react'
import { Card } from '@/components/ui'

/** Bloco do formulário de slide: cartão com título e, se houver, uma frase de orientação. */
export function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-slate-600">{descricao}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  )
}
