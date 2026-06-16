import { Input } from '@client/components/ui'
import { formatCep } from '@shared/utils/format'
import type { CadastroFormData } from './types'
import { UF_OPTIONS } from './constants'

interface EnderecoFieldsProps {
  formData: CadastroFormData
  updateField: (field: string, value: string) => void
  loadingCep: boolean
  onCepBlur: () => void
}

export function EnderecoFields({
  formData,
  updateField,
  loadingCep,
  onCepBlur,
}: EnderecoFieldsProps) {
  return (
    <fieldset className="space-y-4 pt-2">
      <legend className="block text-sm font-medium text-slate-700 mb-2">
        Endereço
      </legend>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Input
            label="CEP"
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            value={formData.cep}
            onChange={(e) => updateField('cep', formatCep(e.target.value))}
            onBlur={onCepBlur}
            maxLength={9}
            required
            hint={loadingCep ? 'Buscando...' : undefined}
          />
        </div>
        <div className="col-span-2">
          <Input
            label="Logradouro"
            type="text"
            placeholder="Rua, Avenida, etc."
            value={formData.logradouro}
            onChange={(e) => updateField('logradouro', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Número"
          type="text"
          placeholder="123"
          value={formData.numero}
          onChange={(e) => updateField('numero', e.target.value)}
        />
        <div className="col-span-2">
          <Input
            label="Complemento"
            type="text"
            placeholder="Apto, Sala, etc."
            value={formData.complemento}
            onChange={(e) => updateField('complemento', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Bairro"
          type="text"
          placeholder="Bairro"
          value={formData.bairro}
          onChange={(e) => updateField('bairro', e.target.value)}
          required
        />
        <Input
          label="Cidade"
          type="text"
          placeholder="Cidade"
          value={formData.cidade}
          onChange={(e) => updateField('cidade', e.target.value)}
          required
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">UF</label>
          <select
            value={formData.uf}
            onChange={(e) => updateField('uf', e.target.value)}
            required
            className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus-visible:outline-none"
          >
            <option value="">UF</option>
            {UF_OPTIONS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  )
}
