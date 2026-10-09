'use client'

import { IconCheckSimple } from '@/components/ui'

/** Confirmação de que o Memorial pode exibir a imagem. Sem ela a foto não é publicada. */
export function CampoAutorizacao({ marcado, onChange }: { marcado: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${
        marcado ? 'border-oliva-300 bg-oliva-50 text-oliva-900' : 'border-accent-300 bg-accent-100 text-accent-950'
      }`}
    >
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-tinta-900/30 accent-brand-600"
      />
      <span>
        <strong className="flex items-center gap-1 font-bold">
          {marcado && <IconCheckSimple className="h-4 w-4" />}
          Temos autorização para mostrar esta imagem no site
        </strong>
        <span className="mt-0.5 block">Sem esta confirmação e sem crédito, a foto fica guardada no acervo mas não é publicada.</span>
      </span>
    </label>
  )
}
