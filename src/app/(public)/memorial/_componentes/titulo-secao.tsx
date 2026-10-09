import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'

interface TituloSecaoProps {
  id: string
  titulo: string
  apoio?: string
  link?: { href: string; rotulo: string }
  /** Seção sobre fundo escuro. */
  claro?: boolean
}

/** Título de seção da página do Memorial, com o atalho "ver tudo" quando houver mais. */
export function TituloSecao({ id, titulo, apoio, link, claro }: TituloSecaoProps) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className={`titulo text-3xl leading-none sm:text-5xl ${claro ? 'text-papel-50' : 'text-tinta-900'}`}>
          {titulo}
        </h2>
        {apoio && <p className={`mt-3 max-w-xl text-base ${claro ? 'text-papel-200' : 'text-tinta-700'}`}>{apoio}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className={`group inline-flex min-h-[44px] shrink-0 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            claro ? 'text-accent-300 focus-visible:outline-papel-50' : 'text-brand-700 focus-visible:outline-brand-600'
          }`}
        >
          {link.rotulo}
          <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
