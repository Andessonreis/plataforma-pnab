'use client'

import type { AcaoVisita } from '@/lib/memorial/agendamento/status'
import { campo, rotuloCampo } from '@/app/admin/memorial/_ui'

interface Props {
  id: string
  acao: AcaoVisita
  valor: string
  onChange: (v: string) => void
  onDesistir: () => void
}

/** Campo do motivo de recusa ou cancelamento, que segue no e-mail ao responsável. */
export function CampoMotivo({ id, acao, valor, onChange, onDesistir }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={rotuloCampo}>
        {acao === 'RECUSAR' ? 'Motivo da recusa' : 'Motivo do cancelamento'}
      </label>
      <textarea
        id={id}
        rows={3}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        required
        autoFocus
        className={`${campo} py-2`}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-tinta-600">O responsável recebe este texto por e-mail.</p>
        <button
          type="button"
          onClick={onDesistir}
          className="min-h-[44px] px-2 text-sm font-semibold text-tinta-700 underline underline-offset-4 hover:text-tinta-900"
        >
          Desistir
        </button>
      </div>
    </div>
  )
}
