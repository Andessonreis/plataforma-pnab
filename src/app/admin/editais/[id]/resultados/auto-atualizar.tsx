'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const INTERVALO_MS = 30_000

function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

/**
 * Recarrega a prévia sozinha enquanto a classificação ainda está viva — a
 * Secretaria marcando bonificação e os pareceristas lançando nota mudam o
 * ranking sem aviso, e uma tela parada em reunião leva a decisão errada.
 *
 * Pausa quando a aba sai de foco, para não bater no servidor à toa, e refaz
 * uma atualização assim que ela volta.
 */
export function AutoAtualizar() {
  const router = useRouter()
  const [pendente, startTransition] = useTransition()
  const [ligado, setLigado] = useState(true)
  const [ultima, setUltima] = useState<string | null>(null)

  useEffect(() => {
    if (!ligado) return

    function atualizar() {
      if (document.visibilityState !== 'visible') return
      startTransition(() => {
        router.refresh()
        setUltima(horaAgora())
      })
    }

    const id = setInterval(atualizar, INTERVALO_MS)
    document.addEventListener('visibilitychange', atualizar)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', atualizar)
    }
  }, [ligado, router])

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span
          className={[
            'h-1.5 w-1.5 rounded-full',
            !ligado ? 'bg-slate-300' : pendente ? 'bg-amber-500' : 'bg-emerald-500',
          ].join(' ')}
          aria-hidden="true"
        />
        {!ligado
          ? 'Atualização automática desligada'
          : pendente
            ? 'Atualizando…'
            : ultima
              ? `Atualizado às ${ultima}`
              : 'Atualiza a cada 30s'}
      </span>
      <button
        type="button"
        onClick={() => setLigado((v) => !v)}
        className="text-slate-500 hover:text-slate-700 underline underline-offset-2 focus-visible:outline-2"
      >
        {ligado ? 'Pausar' : 'Retomar'}
      </button>
    </div>
  )
}
