'use client'

import { CampoSenha } from '@/components/ui'
import { Aviso } from '@/components/ui/aviso'
import { BotaoCarregando } from '../_componentes/botao-carregando'
import { botaoContorno } from '../estilos'
import { SecaoPainel } from '../secao-painel'
import { camposNoPapel } from './estilo-campos'
import type { usePasswordForm } from './hooks/use-password-form'

type PasswordFormState = ReturnType<typeof usePasswordForm>

/** Troca de senha, com envio próprio: não se mistura com o salvar dos dados cadastrais. */
export function PasswordSection({
  currentPassword, newPassword, confirmPassword,
  setCurrentPassword, setNewPassword, setConfirmPassword,
  loading, message, handleSubmit,
}: PasswordFormState) {
  return (
    <SecaoPainel id="tour-perfil-senha" titulo="Senha de acesso">
      <p className="mb-5 max-w-prose text-tinta-700">
        Para trocar, confirme a senha que você usa hoje. A nova precisa ter pelo menos 8 caracteres.
      </p>

      <form onSubmit={handleSubmit} className={`${camposNoPapel} space-y-5`}>
        <div className="sm:max-w-[calc(50%-0.625rem)]">
          <CampoSenha
            label="Senha atual"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        {/* deslop-ignore-next-line 28 — par de campos de formulário, não grade de cartões */}
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoSenha
            label="Nova senha"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            hint="Mínimo de 8 caracteres"
          />
          <CampoSenha
            label="Repita a nova senha"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {message && <Aviso tom={message.type === 'success' ? 'sucesso' : 'erro'}>{message.text}</Aviso>}

        <div id="tour-perfil-alterar-senha-btn">
          <BotaoCarregando type="submit" carregando={loading} estilo={`${botaoContorno} w-full text-tinta-900 sm:w-auto`}>
            Trocar senha
          </BotaoCarregando>
        </div>
      </form>
    </SecaoPainel>
  )
}
