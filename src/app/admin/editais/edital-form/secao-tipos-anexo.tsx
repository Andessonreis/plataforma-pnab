'use client'

import { Button, Select, IconClose } from '@/components/ui'
import { useEditalForm } from './edital-form-context'
import type { TipoAnexoDisponivel } from './use-edital-form-data'

export function SecaoTiposAnexo({ tiposAnexoDisponiveis }: { tiposAnexoDisponiveis: TipoAnexoDisponivel[] }) {
  const { tiposAnexo, setTiposAnexo } = useEditalForm()

  function addTipoIndividual(tipoId: string) {
    const found = tiposAnexoDisponiveis.find((t) => t.id === tipoId)
    if (!found) return
    if (tiposAnexo.some((t) => t.tipo === found.tipo)) return
    setTiposAnexo((prev) => [...prev, { tipo: found.tipo, label: found.label, obrigatorio: found.obrigatorio }])
  }

  const opcoesDisponiveis = tiposAnexoDisponiveis.filter((t) => !tiposAnexo.some((ta) => ta.tipo === t.tipo))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-sm text-slate-500">
          Selecione os tipos de documento que o proponente deverá enviar neste edital.{' '}
          <a
            href="/admin/configuracoes/tipos-anexo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:text-brand-700 underline"
          >
            Gerenciar tipos
          </a>
        </p>
        {tiposAnexo.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {tiposAnexo.length} tipo{tiposAnexo.length !== 1 ? 's' : ''} selecionado{tiposAnexo.length !== 1 ? 's' : ''}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => setTiposAnexo([])}>
              Limpar todos
            </Button>
          </div>
        )}
      </div>

      {opcoesDisponiveis.length > 0 && (
        <div className="mb-4">
          <Select
            label="Adicionar tipo"
            value=""
            options={opcoesDisponiveis.map((t) => ({
              value: t.id,
              label: `${t.label} (${t.tag})${t.obrigatorio ? ' *' : ''}`,
            }))}
            placeholder="Selecionar tipo..."
            onChange={(e) => {
              if (e.target.value) addTipoIndividual(e.target.value)
            }}
          />
        </div>
      )}

      {tiposAnexo.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum tipo selecionado. Use o dropdown acima para adicionar os tipos de anexo deste edital.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tiposAnexo.map((ta, idx) => (
            <div key={idx} className="inline-flex flex-col items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-900">{ta.label}</span>
                <button
                  type="button"
                  onClick={() => setTiposAnexo((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-0.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label={`Remover ${ta.label}`}
                >
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={ta.obrigatorio}
                  onChange={(e) =>
                    setTiposAnexo((prev) => prev.map((t, i) => (i === idx ? { ...t, obrigatorio: e.target.checked } : t)))
                  }
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-500">Obrigatório</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
