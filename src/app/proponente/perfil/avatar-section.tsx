'use client'

import type { ChangeEvent } from 'react'
import { UserAvatar, IconEdit } from '@/components/ui'

interface AvatarSectionProps {
  nome: string
  avatarUrl: string | null
  avatarBusy: boolean
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

/** Controle compacto de foto de perfil — avatar com botão de edição sobreposto.
 * Sem card ou título próprios: vive dentro do cabeçalho de perfil. */
export function AvatarSection({ nome, avatarUrl, avatarBusy, onUpload, onRemove }: AvatarSectionProps) {
  const busyClass = avatarBusy ? 'pointer-events-none opacity-60' : ''

  return (
    <div id="tour-perfil-foto" className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative">
        <UserAvatar nome={nome || 'Usuário'} src={avatarUrl} size={96} />

        {/* deslop-ignore-next-line 19 — badge circular sobre avatar: exceção explícita do guia de estilo pra badge/avatar/dot */}
        <label className={`absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-700 hover:bg-brand-50 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 ${busyClass}`}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onUpload}
            disabled={avatarBusy}
            className="sr-only"
          />
          <IconEdit className="h-4 w-4" />
          <span className="sr-only">{avatarUrl ? 'Trocar foto' : 'Enviar foto'}</span>
        </label>
      </div>

      {avatarBusy && <span className="text-xs text-slate-500">Enviando...</span>}

      {avatarUrl && !avatarBusy && (
        <button
          type="button"
          onClick={onRemove}
          className="min-h-[44px] rounded px-3 text-xs font-medium text-slate-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Remover foto
        </button>
      )}
    </div>
  )
}
