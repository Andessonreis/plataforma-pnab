import { imagemDoItem } from '@/lib/memorial/midia'
import { AntesHoje } from './antes-hoje'

interface ItemComparavel {
  id: string
  titulo: string
  legenda: string | null
  local: string | null
  dataAproximada: string | null
  decada: number | null
  credito: string | null
  contextoHistorico: string | null
  arquivoUrl: string | null
  versaoWebUrl: string | null
  fotoAtualUrl: string | null
}

/** Itens que têm foto histórica e foto atual do mesmo lugar. */
export function comparaveis<T extends ItemComparavel>(itens: T[]) {
  return itens.filter((i) => i.fotoAtualUrl && imagemDoItem(i))
}

/**
 * Pares ANTES/HOJE, um por vez e em largura de leitura: a comparação pede atenção,
 * não cabe em miniatura.
 */
export function Comparacoes({ itens }: { itens: ItemComparavel[] }) {
  return (
    <ol className="space-y-14">
      {itens.map((item) => {
        const quando = item.dataAproximada ?? (item.decada ? `anos ${item.decada}` : null)
        return (
          <li key={item.id} className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
            <AntesHoje
              antes={imagemDoItem(item)!}
              hoje={item.fotoAtualUrl!}
              descricao={item.legenda ?? item.titulo}
              quando={quando}
            />
            <div>
              <h3 className="text-xl font-semibold leading-snug text-tinta-900 sm:text-2xl">{item.titulo}</h3>
              {item.local && <p className="mt-1 text-sm text-tinta-600">{item.local}</p>}
              {item.contextoHistorico && (
                <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-tinta-700">{item.contextoHistorico}</p>
              )}
              {item.credito && <p className="mt-4 text-xs text-tinta-500">Foto histórica: {item.credito}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
