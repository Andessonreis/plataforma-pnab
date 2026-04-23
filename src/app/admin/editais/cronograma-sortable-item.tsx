'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CronogramaFormItem, CronogramaValidationWarning } from '@/types/cronograma'
import { editalCronogramaLabel } from '@/lib/status-maps'
import { getItemValidationWarnings } from '@/lib/utils/cronograma'

interface CronogramaSortableItemProps {
  item: CronogramaFormItem
  warnings: CronogramaValidationWarning[]
  onUpdate: (id: string, field: 'dataHora' | 'label', value: string) => void
  onRemove: (id: string) => void
}

export function CronogramaSortableItem({
  item,
  warnings,
  onUpdate,
  onRemove,
}: CronogramaSortableItemProps) {
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
  }

  const itemWarnings = getItemValidationWarnings(item.id, warnings)
  const hasWarning = itemWarnings.length > 0
  const label = item.tipo === 'fase' ? editalCronogramaLabel[item.fase] : item.label

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'rounded-lg border p-3 transition-colors',
        isDragging ? 'opacity-50 shadow-lg z-10' : '',
        hasWarning
          ? 'border-red-300 bg-red-50'
          : 'border-slate-200 bg-white',
      ].join(' ')}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Handle de arrastar */}
        <button
          type="button"
          className="shrink-0 cursor-grab active:cursor-grabbing rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 min-h-[44px] min-w-[44px] flex items-center justify-center touch-none"
          aria-label={`Reordenar ${label}`}
          {...attributes}
          {...listeners}
          aria-roledescription="item arrastável"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>

        {/* Label */}
        {item.tipo === 'fase' ? (
          <span className="text-sm font-medium text-slate-700 sm:w-56 shrink-0">
            {label}
          </span>
        ) : (
          <input
            type="text"
            value={item.label}
            onChange={(e) => onUpdate(item.id, 'label', e.target.value)}
            placeholder="Nome da etapa..."
            aria-label="Nome da etapa personalizada"
            className="text-sm font-medium text-slate-700 sm:w-56 shrink-0 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200"
          />
        )}

        {/* Data/hora */}
        <div className="flex-1">
          <input
            type="datetime-local"
            value={item.dataHora}
            onChange={(e) => onUpdate(item.id, 'dataHora', e.target.value)}
            aria-label={`Data de ${label}`}
            className={[
              'block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
              hasWarning
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
            ].join(' ')}
          />
          {/* Warning inline */}
          {hasWarning && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1" role="alert">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="shrink-0" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {itemWarnings[0].message}
            </p>
          )}
        </div>

        {/* Botao remover */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remover ${label}`}
          className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Remover
        </button>
      </div>
    </div>
  )
}
