import { useCallback } from 'react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

interface SortableListItem {
  id: string
}

/**
 * Sensors + handler de drag-end padrão para listas reordenáveis com @dnd-kit.
 * A composição de <DndContext>/<SortableContext> fica a cargo de cada consumidor.
 */
export function useSortableList<T extends SortableListItem>(
  items: T[],
  onChange: (items: T[]) => void,
) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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

  return { sensors, handleDragEnd }
}
