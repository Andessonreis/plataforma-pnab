import { Select, Card } from '@client/components/ui'
import type { SelectOption } from '@client/components/ui'

export function EtapaCategoria({
  categorias,
  categoria,
  onCategoriaChange,
}: {
  categorias: string[]
  categoria: string
  onCategoriaChange: (value: string) => void
}) {
  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Selecione a Categoria</h2>
      <p className="text-sm text-slate-500 mb-6">
        Escolha a categoria em que seu projeto se enquadra neste edital.
      </p>
      <Select
        label="Categoria"
        value={categoria}
        onChange={(e) => onCategoriaChange(e.target.value)}
        options={categorias.map((cat): SelectOption => ({ value: cat, label: cat }))}
        placeholder="Selecione a categoria..."
        required
      />
    </Card>
  )
}
