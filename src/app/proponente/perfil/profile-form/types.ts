import type { Dispatch, SetStateAction } from 'react'

export interface ProfileInitialData {
  nome: string
  email: string
  telefone: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  avatarUrl: string | null
}

export type FormMessage = { type: 'success' | 'error'; text: string } | null

export const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export interface AvatarUploadProps {
  nome: string
  avatarUrl: string | null
  avatarBusy: boolean
  avatarMessage: FormMessage
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

export interface DadosPessoaisSectionProps {
  nome: string
  setNome: Dispatch<SetStateAction<string>>
  email: string
  setEmail: Dispatch<SetStateAction<string>>
  telefone: string
  setTelefone: Dispatch<SetStateAction<string>>
  errors: Record<string, string>
  message: FormMessage
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}

export interface EnderecoSectionProps {
  cep: string
  setCep: Dispatch<SetStateAction<string>>
  logradouro: string
  setLogradouro: Dispatch<SetStateAction<string>>
  numero: string
  setNumero: Dispatch<SetStateAction<string>>
  complemento: string
  setComplemento: Dispatch<SetStateAction<string>>
  bairro: string
  setBairro: Dispatch<SetStateAction<string>>
  cidade: string
  setCidade: Dispatch<SetStateAction<string>>
  uf: string
  setUf: Dispatch<SetStateAction<string>>
  loadingCep: boolean
  onCepBlur: () => void
  errors: Record<string, string>
}

export interface SenhaSectionProps {
  currentPassword: string
  setCurrentPassword: Dispatch<SetStateAction<string>>
  newPassword: string
  setNewPassword: Dispatch<SetStateAction<string>>
  confirmPassword: string
  setConfirmPassword: Dispatch<SetStateAction<string>>
  showCurrentPassword: boolean
  setShowCurrentPassword: Dispatch<SetStateAction<boolean>>
  showNewPassword: boolean
  setShowNewPassword: Dispatch<SetStateAction<boolean>>
  showConfirmPassword: boolean
  setShowConfirmPassword: Dispatch<SetStateAction<boolean>>
  loading: boolean
  passwordMessage: FormMessage
  onSubmit: (e: React.FormEvent) => void
}
