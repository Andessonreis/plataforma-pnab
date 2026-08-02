'use client'

import { Input, Select, Button } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { TipoProponente } from '@prisma/client'
import { CHAR_LIMIT_DEFAULTS } from '@/lib/campo-limits'
import { useEditalForm } from './edital-form-context'
import { TogglePillGroup } from './toggle-pill-group'
import { TIPO_PROPONENTE_OPTIONS } from './constants'

const TIPO_CAMPO_OPTIONS = [
  { value: 'texto', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'numero', label: 'Número' },
  { value: 'data', label: 'Data' },
  { value: 'select', label: 'Seleção (dropdown)' },
  { value: 'multiselect', label: 'Seleção múltipla' },
  { value: 'arquivo', label: 'Arquivo' },
]

export function CampoFormularioItem({ campo, index }: { campo: CampoFormulario; index: number }) {
  const { updateCampoFormulario, removeCampoFormulario } = useEditalForm()

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">Campo {index + 1}</span>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => removeCampoFormulario(index)}
          aria-label={`Remover campo ${index + 1}`}
        >
          Remover
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Label (exibido ao proponente)"
          required
          value={campo.label}
          onChange={(e) => updateCampoFormulario(index, 'label', e.target.value)}
          placeholder="Ex.: Nome do Projeto"
        />
        <Select
          label="Tipo do campo"
          required
          value={campo.tipo}
          options={TIPO_CAMPO_OPTIONS}
          onChange={(e) => {
            updateCampoFormulario(index, 'tipo', e.target.value)
            updateCampoFormulario(index, 'minLength', null)
            updateCampoFormulario(index, 'maxLength', null)
          }}
        />
      </div>

      {campo.tipo === 'arquivo' && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
          Campos do tipo <strong>arquivo</strong> aparecem na etapa de <strong>Anexos</strong> da inscrição, não em
          &quot;Dados do Projeto&quot;. Para campos de preenchimento, use outro tipo.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Placeholder"
          value={campo.placeholder}
          onChange={(e) => updateCampoFormulario(index, 'placeholder', e.target.value)}
          placeholder="Texto de exemplo no campo"
        />
        <Input
          label="Dica (hint)"
          value={campo.hint}
          onChange={(e) => updateCampoFormulario(index, 'hint', e.target.value)}
          placeholder="Texto de ajuda abaixo do campo"
        />
      </div>

      {(campo.tipo === 'select' || campo.tipo === 'multiselect') && (
        <Input
          label="Opções (separadas por vírgula)"
          value={(campo.opcoes ?? []).join(', ')}
          onChange={(e) =>
            updateCampoFormulario(
              index,
              'opcoes',
              e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
            )
          }
          placeholder="Opção 1, Opção 2, Opção 3"
        />
      )}

      {(['texto', 'textarea', 'numero'] as const).includes(campo.tipo as 'texto' | 'textarea' | 'numero') &&
        (() => {
          const defaults = CHAR_LIMIT_DEFAULTS[campo.tipo]
          return (
            <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-3 space-y-2">
              <p className="text-xs font-medium text-slate-600">
                Limite de caracteres
                <span className="ml-1 font-normal text-slate-400">— deixe vazio para usar o padrão</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Mínimo"
                  type="number"
                  min={0}
                  value={campo.minLength != null ? String(campo.minLength) : ''}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    updateCampoFormulario(index, 'minLength', v === '' ? null : Number(v))
                  }}
                  placeholder={`Padrão: ${defaults?.minLength ?? 0}`}
                />
                <Input
                  label="Máximo"
                  type="number"
                  min={1}
                  value={campo.maxLength != null ? String(campo.maxLength) : ''}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    updateCampoFormulario(index, 'maxLength', v === '' ? null : Number(v))
                  }}
                  placeholder={`Padrão: ${defaults?.maxLength ?? 200}`}
                />
              </div>
            </div>
          )
        })()}

      <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          checked={campo.obrigatorio}
          onChange={(e) => updateCampoFormulario(index, 'obrigatorio', e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-slate-700">Campo obrigatório</span>
      </label>

      <div>
        <p className="text-xs font-medium text-slate-600 mb-1.5">
          Visível para tipos de proponente
          <span className="ml-1 font-normal text-slate-400">— vazio = todos</span>
        </p>
        <TogglePillGroup
          options={TIPO_PROPONENTE_OPTIONS}
          selected={(campo.tiposProponente ?? []) as TipoProponente[]}
          onToggle={(value) => {
            const current = campo.tiposProponente ?? []
            const next = current.includes(value) ? current.filter((t) => t !== value) : [...current, value]
            updateCampoFormulario(index, 'tiposProponente', next)
          }}
          ariaLabel={`Visibilidade do campo ${index + 1} por tipo de proponente`}
        />
      </div>
    </div>
  )
}
