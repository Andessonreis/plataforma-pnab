import Link from 'next/link'
import { rotuloDecada } from '@/lib/memorial/rotulos'

interface FiltrosGaleriaProps {
  decadas: number[]
  albuns: { nome: string; slug: string }[]
  decada?: number
  album?: string
}

function url(params: { decada?: number; album?: string }) {
  const q = new URLSearchParams()
  if (params.decada) q.set('decada', String(params.decada))
  if (params.album) q.set('album', params.album)
  const s = q.toString()
  return s ? `/memorial/fotografias?${s}` : '/memorial/fotografias'
}

function Opcao({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={ativo ? 'true' : undefined}
        className={`inline-flex min-h-[44px] items-center border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
          ativo ? 'border-tinta-900 bg-tinta-900 font-semibold text-papel-50' : 'border-tinta-900/25 text-tinta-800 hover:border-tinta-900'
        }`}
      >
        {children}
      </Link>
    </li>
  )
}

/** Recortes da galeria por década e por álbum. São links: o filtro fica no endereço e pode ser compartilhado. */
export function FiltrosGaleria({ decadas, albuns, decada, album }: FiltrosGaleriaProps) {
  return (
    <div className="space-y-5">
      {decadas.length > 0 && (
        <nav aria-label="Filtrar por década">
          <p className="mb-2 text-sm font-semibold text-tinta-900">Década</p>
          <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            <Opcao href={url({ album })} ativo={!decada}>Todas</Opcao>
            {decadas.map((d) => (
              <Opcao key={d} href={url({ decada: d, album })} ativo={decada === d}>
                {rotuloDecada(d)}
              </Opcao>
            ))}
          </ul>
        </nav>
      )}
      {albuns.length > 0 && (
        <nav aria-label="Filtrar por álbum">
          <p className="mb-2 text-sm font-semibold text-tinta-900">Álbum</p>
          <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            <Opcao href={url({ decada })} ativo={!album}>Todos</Opcao>
            {albuns.map((a) => (
              <Opcao key={a.slug} href={url({ decada, album: a.slug })} ativo={album === a.slug}>
                {a.nome}
              </Opcao>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
