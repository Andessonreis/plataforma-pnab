'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { InscricaoStatus } from '@prisma/client'
import EnviarRelatorioModal, { type DestinatarioOption } from './enviar-relatorio-modal'

interface EnviarRelatorioButtonProps {
  total: number
  statusSelecionado?: InscricaoStatus
  destinatarios: DestinatarioOption[]
}

export default function EnviarRelatorioButton({
  total,
  statusSelecionado,
  destinatarios,
}: EnviarRelatorioButtonProps) {
  const [aberto, setAberto] = useState(false)
  const searchParams = useSearchParams()

  // Sem status definido não dá pra rotular o relatório ("Lista de quê?").
  const desabilitado = total === 0 || !statusSelecionado || destinatarios.length === 0

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        disabled={desabilitado}
        title={
          !statusSelecionado
            ? 'Escolha um status para enviar o relatório'
            : total === 0
              ? 'Nenhuma inscrição no recorte atual'
              : undefined
        }
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 min-h-[44px] transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Enviar por e-mail
      </button>

      {aberto && statusSelecionado && (
        <EnviarRelatorioModal
          total={total}
          status={statusSelecionado}
          editalId={searchParams.get('editalId') ?? undefined}
          categoria={searchParams.get('categoria') ?? undefined}
          destinatarios={destinatarios}
          onClose={() => setAberto(false)}
        />
      )}
    </>
  )
}
