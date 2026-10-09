'use client'

import type { TipoProponente } from '@prisma/client'
import { useAvatarUpload } from './hooks/use-avatar-upload'
import { usePersonalDataForm, type PersonalDataInitial } from './hooks/use-personal-data-form'
import { usePasswordForm } from './hooks/use-password-form'
import { FichaIdentidade } from './ficha-identidade'
import { FotoPerfil } from './foto-perfil'
import { PersonalDataSection } from './personal-data-section'
import { PasswordSection } from './password-section'

interface ProfileFormProps {
  initialData: PersonalDataInitial & {
    avatarUrl: string | null
    cpfCnpj: string | null
    tipoProponente: TipoProponente | null
    createdAt: Date
  }
}

/**
 * Ficha cadastral: canhoto de identidade à esquerda (fixo no desktop, no
 * topo do celular) e, à direita, os dados editáveis e a senha. Foto, dados e
 * senha têm hooks próprios porque são três envios independentes.
 */
export function ProfileForm({ initialData }: ProfileFormProps) {
  const avatar = useAvatarUpload(initialData.avatarUrl)
  const personalData = usePersonalDataForm(initialData)
  const passwordForm = usePasswordForm()

  return (
    <div className="grid gap-12 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-16">
      <FichaIdentidade
        nome={personalData.values.nome}
        tipoProponente={initialData.tipoProponente}
        cpfCnpj={initialData.cpfCnpj}
        createdAt={initialData.createdAt}
        foto={
          <FotoPerfil
            nome={personalData.values.nome}
            avatarUrl={avatar.avatarUrl}
            ocupado={avatar.avatarBusy}
            onEnviar={avatar.handleAvatarUpload}
            onRemover={avatar.handleAvatarRemove}
          />
        }
      />

      <div className="min-w-0 space-y-16">
        <PersonalDataSection {...personalData} />
        <PasswordSection {...passwordForm} />
      </div>
    </div>
  )
}
