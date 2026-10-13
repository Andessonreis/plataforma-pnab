import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { ImagemMemorial } from '@/components/memorial/imagem-memorial'
import { IconCheckSimple, IconStar } from '@/components/ui'
import { pendenciasExposicao } from '@/lib/memorial/publicacao'
import { StatusChip } from '../../_ui'
import { juntarLista } from '../../_ui/acervo-fluxo'

export interface ExposicaoCartao {
  id: string
  titulo: string
  subtitulo: string | null
  descricao: string | null
  periodo: string | null
  localizacao: string | null
  capaUrl: string | null
  destaque: boolean
  status: StatusConteudo
}

/** Linha de rodapé do cartão: o que falta, pronta ou já no ar. Texto, não só cor. */
function Rodape({ e }: { e: ExposicaoCartao }) {
  const falta = pendenciasExposicao(e)
  if (e.status === 'PUBLICADO') return <p className="text-sm font-semibold text-oliva-800">No ar no site</p>
  if (e.status === 'ARQUIVADO') return <p className="text-sm text-tinta-600">Fora do site</p>
  if (falta.length > 0)
    return <p className="rounded-md bg-accent-100 px-2.5 py-1.5 text-sm font-semibold text-accent-900">Falta {juntarLista(falta)}</p>
  return (
    <p className="flex items-center gap-1 text-sm font-semibold text-oliva-800">
      <IconCheckSimple className="h-4 w-4" /> Pronta para publicar
    </p>
  )
}

/** Exposição reconhecida pela capa grande; título e situação logo abaixo. */
export function CartaoExposicao({ e }: { e: ExposicaoCartao }) {
  return (
    <Link
      href={`/admin/memorial/exposicoes/${e.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-tinta-900/10 bg-white hover:border-tinta-900/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    >
      <div className="relative aspect-[16/10] bg-papel-200">
        {e.capaUrl ? (
          <ImagemMemorial src={e.capaUrl} alt={`Capa da exposição ${e.titulo}`} sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" />
        ) : (
          <span className="flex h-full items-center justify-center text-sm font-semibold text-tinta-600">Sem imagem de capa</span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white shadow-sm">
          <StatusChip tipo="conteudo" status={e.status} />
        </span>
        {e.destaque && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-tinta-800 shadow-sm">
            <IconStar className="h-3.5 w-3.5 text-accent-600" /> Em destaque
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {e.periodo && <p className="text-sm font-semibold text-brand-700">{e.periodo}</p>}
        <h2 className="text-lg font-bold leading-snug text-tinta-900 group-hover:text-brand-700 group-hover:underline">{e.titulo}</h2>
        {e.subtitulo && <p className="line-clamp-2 text-sm text-tinta-700">{e.subtitulo}</p>}
        <div className="mt-auto pt-3">
          <Rodape e={e} />
        </div>
      </div>
    </Link>
  )
}
