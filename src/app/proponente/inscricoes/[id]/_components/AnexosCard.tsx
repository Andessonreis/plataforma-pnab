import { Card, Badge } from '@client/components/ui'

interface AnexoView {
  id: string
  titulo: string
  tipo: string
  valido: boolean | null
}

interface AnexosCardProps {
  anexos: AnexoView[]
}

export function AnexosCard({ anexos }: AnexosCardProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Anexos</h2>
      <ul className="space-y-2">
        {anexos.map((anexo) => (
          <li key={anexo.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{anexo.titulo}</p>
              <p className="text-xs text-slate-500">{anexo.tipo}</p>
            </div>
            {anexo.valido !== null && (
              <Badge variant={anexo.valido ? 'success' : 'error'}>
                {anexo.valido ? 'Válido' : 'Inválido'}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
