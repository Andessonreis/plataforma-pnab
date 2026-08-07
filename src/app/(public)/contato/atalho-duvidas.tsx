import Link from 'next/link'
import { IconArrowRight, IconQuestion } from '@/components/ui/icons'

/**
 * Lembrete para checar o FAQ antes de escrever.
 *
 * Vem antes do formulário de propósito: depois de escrever a mensagem,
 * ninguém volta para conferir se a resposta já existia.
 */
export function AtalhoDuvidas() {
  return (
    <Link
      href="/faq"
      className="group flex items-start gap-4 border-l-4 border-accent-500 bg-papel-100/70 p-5 transition-colors hover:bg-papel-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    >
      <IconQuestion className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
      <span>
        <span className="block titulo text-lg leading-snug tracking-wide text-tinta-900">
          Sua pergunta pode já ter resposta
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-tinta-600">
          Prazos, documentos e recursos são o que mais perguntam. Vale conferir antes de escrever.
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          Ver dúvidas frequentes
          <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  )
}
