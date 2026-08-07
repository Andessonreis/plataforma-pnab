'use client'

export type Modo = 'arquivo' | 'link'

interface VideoAttachTabsProps {
  modo: Modo
  onChange: (modo: Modo) => void
}

// Seletor de modo de envio do vídeo — arquivo direto ou link de serviço externo.
export function VideoAttachTabs({ modo, onChange }: VideoAttachTabsProps) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Como enviar o vídeo">
      <button
        type="button"
        role="tab"
        aria-selected={modo === 'arquivo'}
        onClick={() => onChange('arquivo')}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
          modo === 'arquivo' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Enviar arquivo
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={modo === 'link'}
        onClick={() => onChange('link')}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
          modo === 'link' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        Colar link do vídeo
      </button>
    </div>
  )
}
