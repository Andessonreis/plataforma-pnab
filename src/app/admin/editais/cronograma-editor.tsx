'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { EditalStatus } from '@prisma/client'
import type { CronogramaFormItem, CronogramaValidationWarning } from '@/types/cronograma'
import { CRONOGRAMA_FASES_FORMULARIO } from '@/types/cronograma'
import { editalCronogramaLabel } from '@/lib/status-maps'
import { generateFormItemId, validateCronogramaOrder } from '@/lib/utils/cronograma'
import { Button } from '@/components/ui'
import { CronogramaSortableItem } from './cronograma-sortable-item'

interface CronogramaEditorProps {
  items: CronogramaFormItem[]
  onChange: (items: CronogramaFormItem[]) => void
  /** Warnings calculados externamente (para o form usar no submit) */
  warnings: CronogramaValidationWarning[]
}

export function CronogramaEditor({ items, onChange, warnings }: CronogramaEditorProps) {
  const [addFaseOpen, setAddFaseOpen] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Fases já presentes no cronograma
  const fasesPresentes = useMemo(() => {
    const set = new Set<EditalStatus>()
    for (const item of items) {
      if (item.tipo === 'fase') set.add(item.fase)
    }
    return set
  }, [items])

  // Fases disponíveis para adicionar
  const fasesDisponiveis = useMemo(
    () => CRONOGRAMA_FASES_FORMULARIO.filter((f) => !fasesPresentes.has(f)),
    [fasesPresentes],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      onChange(arrayMove(items, oldIndex, newIndex))
    },
    [items, onChange],
  )

  const handleUpdate = useCallback(
    (id: string, field: 'dataHora' | 'label' | 'fimEm' | 'acao', value: string) => {
      onChange(
        items.map((item) => {
          if (item.id !== id) return item
          // Strings vazias em fimEm/acao significam "limpar campo"
          if ((field === 'fimEm' || field === 'acao') && value === '') {
            const next = { ...item } as Record<string, unknown>
            delete next[field]
            return next as unknown as typeof item
          }
          return { ...item, [field]: value }
        }),
      )
    },
    [items, onChange],
  )

  const handleRemove = useCallback(
    (id: string) => {
      onChange(items.filter((item) => item.id !== id))
    },
    [items, onChange],
  )

  // Carregar template padrão (8 fases com datas vazias)
  function loadTemplate() {
    const templateItems: CronogramaFormItem[] = CRONOGRAMA_FASES_FORMULARIO.map((fase) => ({
      id: generateFormItemId(),
      tipo: 'fase' as const,
      fase,
      dataHora: '',
    }))
    onChange(templateItems)
  }

  // Adicionar uma fase específica
  function addFase(fase: EditalStatus) {
    const newItem: CronogramaFormItem = {
      id: generateFormItemId(),
      tipo: 'fase',
      fase,
      dataHora: '',
    }
    onChange([...items, newItem])
    setAddFaseOpen(false)
  }

  // Adicionar etapa personalizada
  function addCustomItem() {
    const newItem: CronogramaFormItem = {
      id: generateFormItemId(),
      tipo: 'custom',
      label: '',
      dataHora: '',
    }
    onChange([...items, newItem])
  }

  return (
    <div className="space-y-4">
      {/* Banner de warnings */}
      {warnings.length > 0 && (
        <div
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3"
          role="alert"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="shrink-0 text-amber-600" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            {warnings.length === 1
              ? '1 data está fora de ordem cronológica'
              : `${warnings.length} datas estão fora de ordem cronológica`}
          </p>
        </div>
      )}

      {/* Estado vazio */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 py-10 px-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 mb-3" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <p className="text-sm text-slate-500 mb-4">
            Nenhuma etapa definida no cronograma.
          </p>
          <Button type="button" variant="primary" size="sm" onClick={loadTemplate}>
            Carregar Cronograma Padrão
          </Button>
        </div>
      ) : (
        <>
          {/* Lista sortable */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2" role="list" aria-label="Etapas do cronograma">
                {items.map((item) => (
                  <CronogramaSortableItem
                    key={item.id}
                    item={item}
                    warnings={warnings}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Dropdown adicionar fase */}
            {fasesDisponiveis.length > 0 && (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddFaseOpen(!addFaseOpen)}
                  aria-expanded={addFaseOpen}
                  aria-haspopup="listbox"
                >
                  + Adicionar Fase
                </Button>
                {addFaseOpen && (
                  <>
                    {/* Overlay para fechar */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAddFaseOpen(false)}
                      aria-hidden="true"
                    />
                    <ul
                      role="listbox"
                      className="absolute left-0 top-full mt-1 z-20 w-72 rounded-lg border border-slate-200 bg-white shadow-lg py-1 max-h-64 overflow-y-auto"
                    >
                      {fasesDisponiveis.map((fase) => (
                        <li key={fase}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                            onClick={() => addFase(fase)}
                          >
                            {editalCronogramaLabel[fase]}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            <Button type="button" variant="outline" size="sm" onClick={addCustomItem}>
              + Etapa Personalizada
            </Button>

            {/* Botão resetar para o cronograma padrão */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowResetModal(true)}
              className="text-slate-500"
            >
              Resetar para Padrão
            </Button>
          </div>
        </>
      )}

      {/* Modal de confirmação para resetar */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowResetModal(false)}
          aria-modal="true"
          role="dialog"
          aria-labelledby="reset-modal-title"
        >
          <div
            className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="reset-modal-title" className="text-lg font-semibold text-slate-900">
              Resetar cronograma
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Isso substituirá todas as etapas atuais pelo cronograma padrão. As datas preenchidas serão perdidas.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResetModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  loadTemplate()
                  setShowResetModal(false)
                }}
              >
                Resetar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
