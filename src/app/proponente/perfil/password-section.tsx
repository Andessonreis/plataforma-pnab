'use client'

import { Card, CampoSenha, Button, InlineFeedback } from '@/components/ui'
import type { usePasswordForm } from './hooks/use-password-form'

type PasswordFormState = ReturnType<typeof usePasswordForm>

export function PasswordSection({
  currentPassword, newPassword, confirmPassword,
  setCurrentPassword, setNewPassword, setConfirmPassword,
  loading, message, handleSubmit,
}: PasswordFormState) {
  return (
    <Card id="tour-perfil-senha" className="shadow-none">
      <h3 className="mb-5 text-base font-semibold text-slate-900">Alterar senha</h3>

      {message && (
        <div className="mb-4">
          <InlineFeedback type={message.type} message={message.text} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <CampoSenha
          label="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <CampoSenha
          label="Nova senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          hint="Mínimo 8 caracteres"
        />
        <CampoSenha
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div id="tour-perfil-alterar-senha-btn" className="pt-2 sm:flex sm:justify-end">
          <Button type="submit" loading={loading} variant="outline" className="w-full sm:w-auto">
            Alterar senha
          </Button>
        </div>
      </form>
    </Card>
  )
}
