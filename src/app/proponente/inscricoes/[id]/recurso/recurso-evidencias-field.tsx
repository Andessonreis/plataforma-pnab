import { IconPlus } from '@/components/ui'
import { MAX_ARQUIVOS, formatFileSize, type AnexoLocal } from './use-recurso-evidencias'

interface Props {
  anexos: AnexoLocal[]
  limiteError: string | null
  loading: boolean
  onAddFiles: (files: FileList) => void
  onRemove: (index: number) => void
}

export function RecursoEvidenciasField({ anexos, limiteError, loading, onAddFiles, onRemove }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Evidências (opcional)</label>
      <p className="text-xs text-slate-500 mb-2">
        Anexe documentos que comprovem seus argumentos (PDF, PNG ou JPEG — até 10MB cada, máx. {MAX_ARQUIVOS} arquivos).
      </p>

      <label className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 cursor-pointer hover:border-brand-400 hover:text-brand-700 transition-colors">
        <IconPlus className="h-4 w-4" />
        Adicionar arquivo(s)
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          disabled={loading || anexos.length >= MAX_ARQUIVOS}
          onChange={(e) => {
            if (e.target.files) onAddFiles(e.target.files)
            e.target.value = ''
          }}
          className="hidden"
        />
      </label>

      {limiteError && <p className="text-xs text-red-700 mt-1.5">{limiteError}</p>}

      {anexos.length > 0 && (
        <ul className="mt-2 space-y-1.5" role="list">
          {anexos.map((a, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span className="truncate text-slate-900">{a.file.name}</span>
                <span className="text-xs text-slate-500 shrink-0">{formatFileSize(a.file.size)}</span>
                {a.status === 'enviando' && <span className="text-xs text-accent-600 shrink-0">enviando…</span>}
                {a.status === 'ok' && <span className="text-xs text-brand-700 shrink-0">✓ enviado</span>}
                {a.status === 'erro' && <span className="text-xs text-red-700 shrink-0">✗ {a.error}</span>}
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                disabled={loading}
                className="text-slate-500 hover:text-red-700 text-xs font-medium px-2 disabled:opacity-50 min-h-[44px] rounded"
                aria-label={`Remover ${a.file.name}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
