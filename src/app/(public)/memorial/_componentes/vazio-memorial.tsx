import Link from 'next/link'

/** Seção ainda sem conteúdo publicado: diz isso com clareza e aponta um caminho. */
export function VazioMemorial({ texto }: { texto: string }) {
  return (
    <div className="max-w-xl border-t-2 border-tinta-900 py-10">
      <p className="text-lg leading-relaxed text-tinta-800">{texto}</p>
      <Link
        href="/memorial"
        className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Voltar ao Memorial
      </Link>
    </div>
  )
}
