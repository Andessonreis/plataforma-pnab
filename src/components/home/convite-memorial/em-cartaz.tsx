import Image from 'next/image'
import Link from 'next/link'
import type { ConviteMemorial } from './tipos'

/**
 * Exposições publicadas no painel do Memorial. Sem nenhuma publicada o bloco
 * some — melhor que anunciar uma exposição que não existe.
 */
export function EmCartaz({ exposicoes }: { exposicoes: ConviteMemorial['exposicoes'] }) {
  if (exposicoes.length === 0) return null

  return (
    <div>
      <h3 className="titulo text-2xl tracking-wide text-tinta-900">Em cartaz</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {exposicoes.map((expo) => (
          <li key={expo.slug}>
            <Link
              href={`/memorial/exposicoes/${expo.slug}`}
              className="group flex items-center gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
            >
              <span className="relative block aspect-[4/3] w-28 shrink-0 overflow-hidden bg-tinta-800 sm:w-36">
                {expo.capaUrl && (
                  <Image
                    src={expo.capaUrl}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 9rem, 7rem"
                    className="object-cover transition-transform duration-500 [@media(hover:hover)]:group-hover:scale-[1.03]"
                  />
                )}
              </span>
              <span className="block min-w-0">
                <span className="block font-semibold leading-snug text-tinta-900 underline-offset-4 group-hover:underline">
                  {expo.titulo}
                </span>
                {expo.periodo && <span className="block text-sm text-tinta-600">{expo.periodo}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
