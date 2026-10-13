import type { ReactNode } from 'react'
import { Card } from '@/components/ui'

/** Bloco de formulário do painel: título curto, ajuda opcional e os campos. */
export function SecaoForm({ titulo, ajuda, children }: { titulo: string; ajuda?: string; children: ReactNode }) {
  return (
    <Card padding="sm" className="sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
      {ajuda && <p className="mt-1 text-sm text-slate-600">{ajuda}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  )
}
