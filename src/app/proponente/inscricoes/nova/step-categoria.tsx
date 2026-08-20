'use client'

import { Card, Select } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import type { CategoriaConfig } from '@/types/categoria-config'
import type { AuxilioInscricao } from '@/types/auxilio-inscricao'
import { AuxilioInscricaoField } from './auxilio-inscricao-field'

interface StepCategoriaProps {
  categorias: string[]
  categoria: string
  onCategoriaChange: (categoria: string) => void
  categoriaConfig?: CategoriaConfig
  cotasOptIn: string[]
  onToggleCota: (key: string) => void
  /** Só o edital Mestres e Mestras habilita o bloco de auxílio no preenchimento. */
  mostrarAuxilioInscricao?: boolean
  auxilioInscricao?: AuxilioInscricao
  onAuxilioInscricaoChange?: (value: AuxilioInscricao) => void
}

export function StepCategoria({
  categorias,
  categoria,
  onCategoriaChange,
  categoriaConfig,
  cotasOptIn,
  onToggleCota,
  mostrarAuxilioInscricao,
  auxilioInscricao,
  onAuxilioInscricaoChange,
}: StepCategoriaProps) {
  return (
    <Card padding="lg">
      {mostrarAuxilioInscricao && auxilioInscricao && onAuxilioInscricaoChange && (
        <AuxilioInscricaoField value={auxilioInscricao} onChange={onAuxilioInscricaoChange} />
      )}

      <h2 className="text-xl font-semibold text-slate-900 mb-1">Selecione a Categoria</h2>
      <p className="text-sm text-slate-600 mb-6">
        Escolha a categoria em que seu projeto se enquadra neste edital.
      </p>
      <div id="tour-nova-categoria-select">
        <Select
          label="Categoria"
          value={categoria}
          onChange={(e) => onCategoriaChange(e.target.value)}
          options={categorias.map((cat): SelectOption => ({ value: cat, label: cat }))}
          placeholder="Selecione a categoria..."
          required
        />
      </div>

      {categoriaConfig && categoriaConfig.cotas.length > 0 && (
        <div id="tour-nova-categoria-cotas" className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="text-base font-semibold text-slate-900">Deseja concorrer às cotas?</h3>
          <p className="text-sm text-slate-600 mt-1 mb-3">
            Opcional. Ao marcar, você concorrerá simultaneamente às vagas de ampla concorrência e à(s) cota(s)
            escolhida(s), e deverá enviar a autodeclaração correspondente na etapa de anexos.
          </p>
          <div className="space-y-2">
            {categoriaConfig.cotas.map((cota) => (
              <label
                key={cota.key}
                className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={cotasOptIn.includes(cota.key)}
                  onChange={() => onToggleCota(cota.key)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus-visible:ring-2 focus-visible:ring-offset-2"
                />
                {cota.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
