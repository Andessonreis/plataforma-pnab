'use client'

import { Button, Input, ImageUpload } from '@/components/ui'
import type { GaleriaItem } from '@/lib/utils/noticia-galeria'

interface GaleriaEditorProps {
  itens: GaleriaItem[]
  onChange: (itens: GaleriaItem[]) => void
}

/**
 * Editor de galeria/programação — uma linha por dia/atração, cada uma com
 * imagem própria e legenda. Opcional: a maioria das notícias não usa.
 * A data por linha é o que liga o card ao destaque "Hoje" na página pública
 * (`statusDia`, em `noticia-galeria.ts`).
 */
export function GaleriaEditor({ itens, onChange }: GaleriaEditorProps) {
  function atualizarItem(indice: number, campo: keyof GaleriaItem, valor: string) {
    const proximos = itens.map((item, i) =>
      i === indice ? { ...item, [campo]: campo === 'data' && !valor ? null : valor } : item,
    )
    onChange(proximos)
  }

  function remover(indice: number) {
    onChange(itens.filter((_, i) => i !== indice))
  }

  function adicionar() {
    onChange([...itens, { url: '', legenda: '', data: null }])
  }

  return (
    <div className="space-y-4">
      {itens.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Item {i + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => remover(i)}>
              Remover
            </Button>
          </div>
          <div className="space-y-3">
            <ImageUpload
              label="Imagem"
              value={item.url}
              onChange={(url) => atualizarItem(i, 'url', url)}
              pasta="noticias"
              allowClear={false}
            />
            <Input
              label="Legenda"
              value={item.legenda}
              onChange={(e) => atualizarItem(i, 'legenda', e.target.value)}
              placeholder="Ex: Akoko Lati Wa Ni"
            />
            <Input
              label="Data (opcional)"
              type="date"
              value={item.data ?? ''}
              onChange={(e) => atualizarItem(i, 'data', e.target.value)}
              hint="Card do dia atual ganha destaque automático na página pública"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={adicionar}>
        + Adicionar item
      </Button>
    </div>
  )
}
