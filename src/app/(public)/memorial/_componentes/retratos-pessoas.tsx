import Link from 'next/link'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'

export interface PessoaResumo {
  id: string
  slug: string
  nome: string
  periodo: string | null
  fotoUrl: string | null
}

/** Personagens da memória de Irecê: retrato, nome e período, levando à biografia. */
export function RetratosPessoas({ pessoas, nivel = 'h3' }: { pessoas: PessoaResumo[]; nivel?: 'h2' | 'h3' }) {
  const Nome = nivel
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {pessoas.map((p) => (
        <li key={p.id}>
          <Link
            href={`/memorial/pessoas/${p.slug}`}
            className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-tinta-900/10">
              {p.fotoUrl ? (
                <ImagemMemorial src={p.fotoUrl} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="grayscale-[.3] group-hover:grayscale-0" />
              ) : (
                <span className="titulo absolute inset-0 flex items-center justify-center text-6xl text-tinta-900/20" aria-hidden="true">
                  {p.nome.charAt(0)}
                </span>
              )}
            </div>
            <Nome className="mt-3 text-lg font-semibold leading-snug text-tinta-900 group-hover:text-brand-700">{p.nome}</Nome>
            {p.periodo && <p className="text-sm text-tinta-600">{p.periodo}</p>}
          </Link>
        </li>
      ))}
    </ul>
  )
}
