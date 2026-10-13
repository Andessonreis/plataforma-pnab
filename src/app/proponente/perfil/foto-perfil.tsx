'use client'

import type { ChangeEvent } from 'react'
import { UserAvatar } from '@/components/ui'

interface FotoPerfilProps {
  nome: string
  avatarUrl: string | null
  ocupado: boolean
  onEnviar: (e: ChangeEvent<HTMLInputElement>) => void
  onRemover: () => void
}

const acao =
  'inline-flex min-h-[44px] cursor-pointer items-center text-sm font-semibold underline-offset-4 ' +
  '[@media(hover:hover)]:hover:underline'

/**
 * Foto com as ações escritas por extenso. O lápis sobreposto ao avatar não
 * dizia o que fazia, e "remover" ficava escondido até haver foto.
 */
export function FotoPerfil({ nome, avatarUrl, ocupado, onEnviar, onRemover }: FotoPerfilProps) {
  return (
    <div id="tour-perfil-foto" className="flex items-center gap-5 lg:flex-col lg:items-start">
      <UserAvatar nome={nome || 'Proponente'} src={avatarUrl} size={104} className="shrink-0 ring-2 ring-tinta-900 ring-offset-4 ring-offset-papel-50" />

      <div>
        <div className="flex flex-wrap gap-x-5">
          {/* O input fica dentro do rótulo: o rótulo inteiro é o alvo de toque e o foco aparece nele. */}
          <label className={`${acao} text-brand-700 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-tinta-900 ${ocupado ? 'pointer-events-none opacity-60' : ''}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onEnviar} disabled={ocupado} className="sr-only" />
            {avatarUrl ? 'Trocar foto' : 'Enviar foto'}
          </label>
          {avatarUrl && (
            <button
              type="button"
              onClick={onRemover}
              disabled={ocupado}
              className={`${acao} text-tinta-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900 disabled:opacity-60`}
            >
              Remover
            </button>
          )}
        </div>
        <p className="text-sm text-tinta-700" aria-live="polite">
          {ocupado ? 'Enviando a foto…' : 'JPG, PNG ou WEBP.'}
        </p>
      </div>
    </div>
  )
}
