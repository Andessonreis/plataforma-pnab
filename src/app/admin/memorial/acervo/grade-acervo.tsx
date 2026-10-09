import Link from 'next/link'
import type { MemorialTipoAcervo, StatusConteudo } from '@prisma/client'
import { imagemDoItem } from '@/lib/memorial/midia'
import { ROTULO_TIPO_ACERVO } from '@/lib/memorial/rotulos'
import { SeloStatus } from '../_componentes/selo-status'

interface ItemGrade {
  id: string
  titulo: string
  tipo: MemorialTipoAcervo
  status: StatusConteudo
  decada: number | null
  autorizado: boolean
  credito: string | null
  arquivoUrl: string | null
  versaoWebUrl: string | null
  album: { nome: string } | null
}

/** Acervo em miniaturas: foto é o que a equipe reconhece primeiro, antes do título. */
export function GradeAcervo({ itens }: { itens: ItemGrade[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {itens.map((item) => {
        const imagem = imagemDoItem(item)
        const semDireitos = item.tipo === 'FOTOGRAFIA' && (!item.autorizado || !item.credito)
        return (
          <li key={item.id}>
            <Link
              href={`/admin/memorial/acervo/${item.id}`}
              className="group block overflow-hidden rounded-lg border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <div className="aspect-[4/3] bg-slate-100">
                {imagem ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagem} alt="" width={320} height={240} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center p-3 text-center text-xs text-slate-500">
                    {ROTULO_TIPO_ACERVO[item.tipo]} sem imagem
                  </span>
                )}
              </div>
              <div className="space-y-1.5 p-2.5">
                <p className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:underline">{item.titulo}</p>
                <p className="text-xs text-slate-500">
                  {[ROTULO_TIPO_ACERVO[item.tipo], item.decada && `anos ${item.decada}`, item.album?.nome].filter(Boolean).join(' · ')}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <SeloStatus status={item.status} />
                  {semDireitos && <span className="text-xs font-medium text-amber-800">falta crédito ou autorização</span>}
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
