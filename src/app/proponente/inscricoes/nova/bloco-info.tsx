'use client'

import type { CampoFormulario } from '@/types/campo-formulario'

// Bloco informativo (não editável) do formulário dinâmico — texto de apoio ou aviso.
export function BlocoInfo({ campo }: { campo: CampoFormulario }) {
  const variante = campo.variante ?? 'info'
  // Mesma paleta de estado do componente Aviso (src/components/ui/aviso.tsx) —
  // vermelho para alerta e âmbar/accent para atenção são convenções fixas do
  // design system, não gradiente ou cor "default" de IA.
  const paleta =
    variante === 'alerta'
      ? 'border-red-200 bg-red-50 text-red-900' // deslop-ignore 04 05
      : variante === 'atencao'
        ? 'border-accent-200 bg-accent-50 text-accent-900'
        : 'border-slate-200 bg-slate-50 text-slate-900'

  return (
    <div
      className={`rounded-lg border ${paleta} p-4 text-sm`}
      role={variante === 'alerta' ? 'alert' : undefined}
    >
      {campo.label && (
        <p className="font-semibold mb-2">{campo.label}</p>
      )}
      <div className="whitespace-pre-line leading-relaxed">{campo.conteudo ?? ''}</div>
    </div>
  )
}
