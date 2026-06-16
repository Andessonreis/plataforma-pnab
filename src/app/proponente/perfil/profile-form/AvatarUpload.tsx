import { Button, Card, UserAvatar } from '@client/components/ui'
import type { AvatarUploadProps } from './types'

export function AvatarUpload({
  nome,
  avatarUrl,
  avatarBusy,
  avatarMessage,
  onUpload,
  onRemove,
}: AvatarUploadProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Foto de perfil</h2>
      <div className="flex items-center gap-4">
        <UserAvatar nome={nome || 'Usuário'} src={avatarUrl} size={72} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-600 mb-2">
            JPG, PNG ou WEBP, até 2 MB. A foto aparece na sua área e em comunicações.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onUpload}
                disabled={avatarBusy}
                className="sr-only"
              />
              <span
                className={`inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer ${
                  avatarBusy ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {avatarBusy ? 'Enviando...' : avatarUrl ? 'Trocar foto' : 'Enviar foto'}
              </span>
            </label>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                disabled={avatarBusy}
              >
                Remover
              </Button>
            )}
          </div>
          {avatarMessage && (
            <p
              className={`mt-2 text-xs ${
                avatarMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'
              }`}
              role="status"
            >
              {avatarMessage.text}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
