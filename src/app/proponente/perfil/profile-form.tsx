'use client'

import { useState, type FormEvent } from 'react'
import { Input, Button, Card } from '@/components/ui'
import { formatTelefoneBR, unmaskTelefone } from '@/lib/utils/format'

interface ProfileFormProps {
  initialData: {
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
  }
}

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      const res = await fetch('/api/proponente/perfil', {
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
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
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
      const res = await fetch('/api/proponente/perfil', {
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
      {/* Dados pessoais */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Dados Pessoais</h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-brand-50 text-brand-800 border border-brand-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Telefone"
            type="tel"
            inputMode="numeric"
            value={telefone}
            onChange={(e) => setTelefone(formatTelefoneBR(e.target.value))}
            error={errors.telefone}
            hint="Com DDD. Ex: (77) 99999-0000"
            maxLength={15}
          />

          <h3 className="text-sm font-semibold text-slate-700 pt-2">Endereco</h3>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="CEP"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={handleCepBlur}
              error={errors.cep}
              hint={loadingCep ? 'Buscando...' : undefined}
            />
            <div className="col-span-2">
              <Input
                label="Logradouro"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                error={errors.logradouro}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Número"
              value={numero}
              onChange={(e) => {
                // Aceita números, letras (ex: "123A") e "S/N", mas rejeita sinal negativo
                const v = e.target.value.replace(/-/g, '')
                setNumero(v)
              }}
              error={errors.numero}
              hint="Ex: 123, 123A ou S/N"
              maxLength={20}
            />
            <div className="col-span-2">
              <Input
                label="Complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                error={errors.complemento}
                hint="Ex: Apto 302, Casa dos fundos, próximo ao mercado"
                maxLength={100}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              error={errors.bairro}
            />
            <Input
              label="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              error={errors.cidade}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">UF</label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus-visible:outline-none"
              >
                <option value="">UF</option>
                {UF_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>

      {/* Alterar senha */}
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

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Senha atual"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showCurrentPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
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
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNewPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            }
          />
          <Input
            label="Confirmar nova senha"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            }
          />
          <div className="flex justify-end">
            <Button type="submit" loading={loading} variant="outline">
              Alterar Senha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
