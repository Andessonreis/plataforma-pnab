'use client'

/** Confirmação de que o Memorial pode exibir a imagem. Sem ela a foto não é publicada. */
export function CampoAutorizacao({ marcado, onChange }: { marcado: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] items-start gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400"
      />
      <span>
        <strong className="font-semibold">Temos autorização para exibir esta imagem.</strong> Sem esta confirmação e sem
        crédito preenchido, a foto fica guardada no acervo mas não vai para o site.
      </span>
    </label>
  )
}
