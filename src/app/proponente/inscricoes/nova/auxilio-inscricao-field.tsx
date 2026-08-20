'use client'

import { Input } from '@/components/ui'
import { formatCpfCnpj } from '@/lib/utils/format'
import { isValidCpf } from '@/lib/validators/document'
import type { AuxilioInscricao } from '@/types/auxilio-inscricao'

interface AuxilioInscricaoFieldProps {
  value: AuxilioInscricao
  onChange: (value: AuxilioInscricao) => void
}

/**
 * Bloco exclusivo do edital Mestres e Mestras: permite o proponente marcar que
 * a inscrição está sendo preenchida com ajuda de outra pessoa (comum entre
 * idosos) e registrar nome + CPF de quem ajudou. Opcional — nunca obrigatório.
 */
export function AuxilioInscricaoField({ value, onChange }: AuxilioInscricaoFieldProps) {
  const cpfInvalido = value.ativo && value.cpfAuxiliar.length > 0 && !isValidCpf(value.cpfAuxiliar)

  function handleToggle(ativo: boolean) {
    onChange(ativo ? { ...value, ativo } : { ativo: false, nomeAuxiliar: '', cpfAuxiliar: '' })
  }

  return (
    <div id="tour-nova-auxilio-inscricao" className="mb-6 border-b border-slate-200 pb-5">
      <h3 className="text-base font-semibold text-slate-900">Precisou de ajuda para se inscrever?</h3>
      <p className="text-sm text-slate-600 mt-1 mb-3">
        Muitos mestres e mestras preenchem a inscrição com o auxílio de outra pessoa. Se for o seu caso, marque
        a opção abaixo e informe quem te ajudou — é opcional, não é obrigatório ter ajuda.
      </p>

      <label className="flex min-h-[44px] items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={value.ativo}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus-visible:ring-2 focus-visible:ring-offset-2"
        />
        <span>Esta inscrição está sendo preenchida com o auxílio de outra pessoa.</span>
      </label>

      {value.ativo && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome de quem ajudou"
            value={value.nomeAuxiliar}
            onChange={(e) => onChange({ ...value, nomeAuxiliar: e.target.value })}
            placeholder="Nome completo"
            autoComplete="off"
          />
          <Input
            label="CPF de quem ajudou"
            value={value.cpfAuxiliar}
            onChange={(e) => onChange({ ...value, cpfAuxiliar: formatCpfCnpj(e.target.value) })}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
            autoComplete="off"
            error={cpfInvalido ? 'CPF inválido — confira os números.' : undefined}
          />
        </div>
      )}
    </div>
  )
}
