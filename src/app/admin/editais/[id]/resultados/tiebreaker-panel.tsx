'use client'

import { useState } from 'react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui'
import { useSortableList } from '@/hooks/use-sortable-list'

interface InscricaoItem {
  inscricaoId: string
  numero: string
  proponenteNome: string
  categoria: string | null
  notaFinal: number | null
  posicao: number | null
  status: string
}

/** InscricaoItem com `id` alinhado a `inscricaoId`, exigido pelo hook useSortableList */
interface SortableInscricaoItem extends InscricaoItem {
  id: string
}

interface TiebreakerPanelProps {
  editalId: string
  inscricoes: InscricaoItem[]
}

interface TieGroup {
  key: string
  categoria: string | null
  nota: number
  items: InscricaoItem[]
}

function SortableItem({ item, index }: { item: SortableInscricaoItem; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-amber-400 hover:text-amber-600 active:cursor-grabbing"
        aria-label={`Arrastar ${item.proponenteNome}`}
        {...attributes}
        {...listeners}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <span className="text-sm font-medium text-amber-700 w-6">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{item.proponenteNome}</p>
        <p className="text-xs text-slate-500">{item.numero}{item.categoria ? ` · ${item.categoria}` : ''}</p>
      </div>
      <span className="text-sm font-semibold text-slate-700">
        {item.notaFinal != null ? Number(item.notaFinal).toFixed(2) : '—'}
      </span>
    </div>
  )
}

export function TiebreakerPanel({ editalId, inscricoes }: TiebreakerPanelProps) {
  // Identifica grupos empatados — escopado por categoria, pra não misturar
  // empates de categorias diferentes num mesmo grupo de desempate.
  const tieGroups: TieGroup[] = []
  const grupoMap = new Map<string, InscricaoItem[]>()

  for (const item of inscricoes) {
    if (item.notaFinal == null) continue
    const nota = Number(item.notaFinal)
    const key = `${item.categoria ?? '—'}::${nota}`
    if (!grupoMap.has(key)) grupoMap.set(key, [])
    grupoMap.get(key)!.push(item)
  }

  for (const [key, items] of grupoMap) {
    if (items.length > 1) {
      tieGroups.push({ key, categoria: items[0].categoria, nota: Number(items[0].notaFinal), items })
    }
  }

  if (tieGroups.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-700">
          Desempate Manual — {tieGroups.length} grupo(s) empatado(s)
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Arraste os itens para definir a ordem de classificação. A posição de cima tem prioridade.
      </p>

      {tieGroups.map((group) => (
        <TieGroupPanel key={group.key} group={group} editalId={editalId} />
      ))}
    </div>
  )
}

function TieGroupPanel({ group, editalId }: { group: TieGroup; editalId: string }) {
  const [items, setItems] = useState<SortableInscricaoItem[]>(() =>
    group.items.map((item) => ({ ...item, id: item.inscricaoId })),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { sensors, handleDragEnd } = useSortableList(items, (next) => {
    setItems(next)
    setSaved(false)
  })

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/resultados/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: items.map(i => i.inscricaoId) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Erro ao salvar ordem')
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ordem')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
          {group.categoria ? `${group.categoria} — ` : ''}Nota {group.nota.toFixed(2)} — {items.length} inscrições empatadas
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saving ? 'Salvando...' : saved ? 'Ordem salva' : 'Salvar Ordem'}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableItem key={item.id} item={item} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {saved && (
        <p className="text-xs text-green-600">Ordem de desempate salva com sucesso.</p>
      )}
    </div>
  )
}
