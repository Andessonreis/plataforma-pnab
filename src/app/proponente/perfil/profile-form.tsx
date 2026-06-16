'use client'

import { useState, type FormEvent } from 'react'
import { formatTelefoneBR, unmaskTelefone } from '@shared/utils/format'
import { AvatarUpload } from './profile-form/AvatarUpload'
import { DadosPessoaisSection } from './profile-form/DadosPessoaisSection'
import { EnderecoSection } from './profile-form/EnderecoSection'
import { SenhaSection } from './profile-form/SenhaSection'
import type { FormMessage, ProfileInitialData } from './profile-form/types'

interface ProfileFormProps {
  initialData: ProfileInitialData
}

function toFieldErrors(details: unknown): Record<string, string> | null {
  if (!Array.isArray(details)) return null
  const errors: Record<string, string> = {}
  for (const item of details) {
    if (item && typeof item === 'object' && 'path' in item && 'message' in item) {
      const path = (item as { path: unknown }).path
      const field = Array.isArray(path) ? path.join('.') : String(path)
      if (field) errors[field] = String((item as { message: unknown }).message)
    }
  }
  return Object.keys(errors).length > 0 ? errors : null
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [nome, setNome] = useState(initialData.nome)
  const [email, setEmail] = useState(initialData.email)
  const [telefone, setTelefone] = useState(formatTelefoneBR(initialData.telefone))
  const [cep, setCep] = useState(initialData.cep)
  const [logradouro, setLogradouro] = useState(initialData.logradouro)
  const [numero, setNumero] = useState(initialData.numero)
  const [complemento, setComplemento] = useState(initialData.complemento)
  const [bairro, setBairro] = useState(initialData.bairro)
  const [cidade, setCidade] = useState(initialData.cidade)
  const [uf, setUf] = useState(initialData.uf)
  const [loadingCep, setLoadingCep] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<FormMessage>(null)
  const [passwordMessage, setPasswordMessage] = useState<FormMessage>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatarUrl)
  const [avatarMessage, setAvatarMessage] = useState<FormMessage>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // reseta o input
    if (!file) return
    setAvatarBusy(true)
    setAvatarMessage(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/v1/me/avatar', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) {
        setAvatarMessage({ type: 'error', text: json.message ?? 'Falha ao enviar foto' })
        return
      }
      setAvatarUrl(json.data.avatarUrl)
      setAvatarMessage({ type: 'success', text: 'Foto atualizada.' })
      setTimeout(() => setAvatarMessage(null), 4000)
    } catch (err) {
      setAvatarMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro de rede',
      })
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleAvatarRemove() {
    if (!avatarUrl) return
    if (!confirm('Remover sua foto de perfil?')) return
    setAvatarBusy(true)
    setAvatarMessage(null)
    try {
      const res = await fetch('/api/v1/me/avatar', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setAvatarMessage({ type: 'error', text: json.message ?? 'Falha ao remover' })
        return
      }
      setAvatarUrl(null)
      setAvatarMessage({ type: 'success', text: 'Foto removida.' })
      setTimeout(() => setAvatarMessage(null), 4000)
    } catch (err) {
      setAvatarMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro de rede',
      })
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleCepBlur() {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        if (data.logradouro) setLogradouro(data.logradouro)
        if (data.bairro) setBairro(data.bairro)
        if (data.localidade) setCidade(data.localidade)
        if (data.uf) setUf(data.uf)
      }
    } catch { /* silencioso */ }
    finally { setLoadingCep(false) }
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    try {
      const res = await fetch('/api/v1/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, email,
          telefone: unmaskTelefone(telefone),
          cep: cep.replace(/\D/g, ''), logradouro, numero, complemento, bairro, cidade, uf,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const fieldErrors = toFieldErrors(data.details)
        if (fieldErrors) {
          setErrors(fieldErrors)
        } else {
          setMessage({ type: 'error', text: data.message || 'Erro ao atualizar perfil.' })
        }
        return
      }

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso.' })
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas nao coincidem.' })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter no minimo 8 caracteres.' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/v1/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPasswordMessage({ type: 'error', text: data.message || 'Erro ao alterar senha.' })
        return
      }

      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordMessage({ type: 'error', text: 'Erro de conexao. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <AvatarUpload
        nome={nome}
        avatarUrl={avatarUrl}
        avatarBusy={avatarBusy}
        avatarMessage={avatarMessage}
        onUpload={handleAvatarUpload}
        onRemove={handleAvatarRemove}
      />

      <DadosPessoaisSection
        nome={nome}
        setNome={setNome}
        email={email}
        setEmail={setEmail}
        telefone={telefone}
        setTelefone={setTelefone}
        errors={errors}
        message={message}
        loading={loading}
        onSubmit={handleProfileSubmit}
      >
        <EnderecoSection
          cep={cep}
          setCep={setCep}
          logradouro={logradouro}
          setLogradouro={setLogradouro}
          numero={numero}
          setNumero={setNumero}
          complemento={complemento}
          setComplemento={setComplemento}
          bairro={bairro}
          setBairro={setBairro}
          cidade={cidade}
          setCidade={setCidade}
          uf={uf}
          setUf={setUf}
          loadingCep={loadingCep}
          onCepBlur={handleCepBlur}
          errors={errors}
        />
      </DadosPessoaisSection>

      <SenhaSection
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showCurrentPassword={showCurrentPassword}
        setShowCurrentPassword={setShowCurrentPassword}
        showNewPassword={showNewPassword}
        setShowNewPassword={setShowNewPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        loading={loading}
        passwordMessage={passwordMessage}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  )
}
