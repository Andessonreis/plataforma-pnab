import { Input, Button, Card } from '@client/components/ui'
import type { SenhaSectionProps } from './types'

function EyeIcon({ off }: { off: boolean }) {
  if (off) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function ToggleButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
      aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
    >
      <EyeIcon off={show} />
    </button>
  )
}

export function SenhaSection({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  passwordMessage,
  onSubmit,
}: SenhaSectionProps) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Alterar Senha</h2>

      {passwordMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            passwordMessage.type === 'success'
              ? 'bg-brand-50 text-brand-800 border border-brand-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
          role="alert"
        >
          {passwordMessage.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Senha atual"
          type={showCurrentPassword ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          rightIcon={
            <ToggleButton
              show={showCurrentPassword}
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            />
          }
        />
        <Input
          label="Nova senha"
          type={showNewPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          hint="Mínimo 8 caracteres"
          rightIcon={
            <ToggleButton
              show={showNewPassword}
              onClick={() => setShowNewPassword(!showNewPassword)}
            />
          }
        />
        <Input
          label="Confirmar nova senha"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          rightIcon={
            <ToggleButton
              show={showConfirmPassword}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />
        <div className="flex justify-end">
          <Button type="submit" loading={loading} variant="outline">
            Alterar Senha
          </Button>
        </div>
      </form>
    </Card>
  )
}
