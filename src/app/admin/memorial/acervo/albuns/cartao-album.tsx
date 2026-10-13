import type { ReactNode } from 'react'
import Link from 'next/link'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'
import { linkDiscreto } from '../../_ui'

interface Props {
  album: { id: string; nome: string; descricao: string | null }
  quantidade: number
  /** Até quatro fotos do álbum, as mais recentes. */
  capas: { id: string; imagem: string; titulo: string }[]
  /** Formulário de edição, recolhido. */
  children: ReactNode
}

/** Álbum com as fotos que tem dentro: reconhece-se pelo conteúdo, não pelo nome. */
export function CartaoAlbum({ album, quantidade, capas, children }: Props) {
  return (
    <article className="overflow-hidden rounded-xl border border-tinta-900/10 bg-white">
      <div className="grid aspect-[2/1] grid-cols-4 gap-0.5 bg-papel-200">
        {capas.map((c) => (
          <div key={c.id} className="relative">
            <ImagemMemorial src={c.imagem} alt={c.titulo} sizes="(min-width: 640px) 12vw, 25vw" />
          </div>
        ))}
        {capas.length === 0 && (
          <p className="col-span-4 flex items-center justify-center p-4 text-center text-sm text-tinta-600">Nenhuma foto neste álbum ainda.</p>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="text-base font-bold text-tinta-900">{album.nome}</h2>
          <Link href={`/admin/memorial/acervo?albumId=${album.id}`} className={`${linkDiscreto} py-2`}>
            Ver {quantidade} {quantidade === 1 ? 'foto' : 'fotos'}
          </Link>
        </div>
        {album.descricao && <p className="mt-0.5 text-sm text-tinta-600">{album.descricao}</p>}
        <details className="mt-2">
          <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-semibold text-tinta-700 hover:text-brand-700">
            Editar álbum
          </summary>
          <div className="mt-2 border-t border-tinta-900/10 pt-3">{children}</div>
        </details>
      </div>
    </article>
  )
}
