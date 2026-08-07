'use client'

import { useAvatarUpload } from './hooks/use-avatar-upload'
import { usePersonalDataForm, type PersonalDataInitial } from './hooks/use-personal-data-form'
import { usePasswordForm } from './hooks/use-password-form'
import { ProfileHeader } from './profile-summary-card'
import { PersonalDataSection } from './personal-data-section'
import { PasswordSection } from './password-section'

interface ProfileFormProps {
  initialData: PersonalDataInitial & {
    avatarUrl: string | null
    cpfCnpj: string | null
    tipoProponente: string | null
    createdAt: Date
  }
}

/** Orquestra os três blocos editáveis do perfil (foto, dados pessoais e
 * senha) — cada um com seu próprio hook porque são três submits independentes
 * contra endpoints/estados diferentes. O cabeçalho lê nome/e-mail/endereço
 * direto do estado do formulário de dados pessoais, sem duplicar valores. */
export function ProfileForm({ initialData }: ProfileFormProps) {
  const avatar = useAvatarUpload(initialData.avatarUrl)
  const personalData = usePersonalDataForm(initialData)
  const passwordForm = usePasswordForm()

  return (
    <div className="space-y-6">
      <ProfileHeader
        nome={personalData.values.nome}
        email={personalData.values.email}
        avatarUrl={avatar.avatarUrl}
        avatarBusy={avatar.avatarBusy}
        onAvatarUpload={avatar.handleAvatarUpload}
        onAvatarRemove={avatar.handleAvatarRemove}
        tipoProponente={initialData.tipoProponente}
        cpfCnpj={initialData.cpfCnpj}
        telefone={personalData.values.telefone}
        logradouro={personalData.values.logradouro}
        numero={personalData.values.numero}
        complemento={personalData.values.complemento}
        bairro={personalData.values.bairro}
        cidade={personalData.values.cidade}
        uf={personalData.values.uf}
        cep={personalData.values.cep}
        createdAt={initialData.createdAt}
      />
      <PersonalDataSection {...personalData} />
      <PasswordSection {...passwordForm} />
    </div>
  )
}
