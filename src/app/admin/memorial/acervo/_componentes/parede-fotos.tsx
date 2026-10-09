import Link from 'next/link'
import type { MemorialTipoAcervo, StatusConteudo } from '@prisma/client'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'
import { imagemDoItem } from '@/lib/memorial/midia'
import { pendenciasItem } from '@/lib/memorial/publicacao'
import { ROTULO_TIPO_ACERVO, rotuloDecada } from '@/lib/memorial/rotulos'
import { StatusChip } from '../../_ui'
import { juntarLista } from '../../_ui/acervo-fluxo'

export interface ItemParede {
  id: string
  titulo: string
  tipo: MemorialTipoAcervo
  status: StatusConteudo
  decada: number | null
  legenda: string | null
  descricao: string | null
  autorizado: boolean
  credito: string | null
  arquivoUrl: string | null
  versaoWebUrl: string | null
  album: { nome: string } | null
}

/** Nomes curtos das pendências, para caber sobre a miniatura. */
const CURTO: Record<string, string> = { 'autorização de uso': 'autorização', 'arquivo da fotografia': 'foto' }

/**
 * Parede de fotos: a imagem ocupa o ladrilho inteiro, a situação fica no canto
 * e o que falta para publicar aparece numa faixa dourada embaixo, visível de longe.
 */
export function ParedeFotos({ itens }: { itens: ItemParede[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5">
      {itens.map((item) => {
        const imagem = imagemDoItem(item)
        const falta = item.status === 'ARQUIVADO' ? [] : pendenciasItem(item).map((p) => CURTO[p] ?? p)
        const detalhe = [ROTULO_TIPO_ACERVO[item.tipo], item.decada && rotuloDecada(item.decada), item.album?.nome].filter(Boolean)
        return (
          <li key={item.id}>
            <Link
              href={`/admin/memorial/acervo/${item.id}`}
              className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-papel-200 ring-1 ring-tinta-900/10">
                {imagem ? (
                  <ImagemMemorial
                    src={imagem}
                    alt={item.legenda || item.titulo}
                    sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
                    className="transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center p-3 text-center text-sm font-semibold text-tinta-700">
                    {ROTULO_TIPO_ACERVO[item.tipo]} sem imagem
                  </span>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-white shadow-sm">
                  <StatusChip tipo="conteudo" status={item.status} />
                </span>
                {falta.length > 0 && (
                  <span className="absolute inset-x-0 bottom-0 bg-accent-200 px-2.5 py-1.5 text-xs font-semibold leading-snug text-accent-950">
                    Falta {juntarLista(falta)}
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-tinta-900 group-hover:text-brand-700 group-hover:underline">
                {item.titulo}
              </p>
              {detalhe.length > 0 && <p className="mt-0.5 line-clamp-1 text-xs text-tinta-600">{detalhe.join(', ')}</p>}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
