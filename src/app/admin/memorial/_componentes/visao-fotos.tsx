import Link from 'next/link'
import type { StatusConteudo } from '@prisma/client'
import { IconPlus } from '@/components/ui'
import { imagemDoItem } from '@/lib/memorial/midia'
import { BlocoSecao, StatusChip } from '@/app/admin/memorial/_ui'

interface Foto {
  id: string
  titulo: string
  status: StatusConteudo
  decada: number | null
  autorizado: boolean
  credito: string | null
  arquivoUrl: string | null
  versaoWebUrl: string | null
}

/** Últimas fotos do acervo em miniatura, com a situação de cada uma. O primeiro quadro envia mais. */
export function VisaoFotos({ fotos }: { fotos: Foto[] }) {
  return (
    <BlocoSecao titulo="Fotos recentes" verTudo={{ href: '/admin/memorial/acervo', rotulo: 'Ver o acervo' }}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <li>
          <Link
            href="/admin/memorial/acervo/novo"
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-300 bg-brand-50 p-3 text-center text-sm font-bold text-brand-800 hover:border-brand-500 hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <IconPlus className="h-7 w-7" />
            Enviar fotos
          </Link>
        </li>
        {fotos.map((f) => {
          const imagem = imagemDoItem(f)
          const falta = !f.autorizado || !f.credito
          return (
            <li key={f.id}>
              <Link
                href={`/admin/memorial/acervo/${f.id}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-papel-100">
                  {imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagem} alt="" width={240} height={240} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
                  ) : (
                    <span className="flex h-full items-center justify-center p-2 text-center text-xs text-tinta-600">Sem imagem</span>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white shadow-sm">
                    <StatusChip tipo="conteudo" status={f.status} />
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-1 text-sm font-semibold text-tinta-900 group-hover:text-brand-700">{f.titulo}</p>
                {falta && <p className="text-xs text-tinta-700">Falta crédito ou autorização</p>}
              </Link>
            </li>
          )
        })}
      </ul>
    </BlocoSecao>
  )
}
