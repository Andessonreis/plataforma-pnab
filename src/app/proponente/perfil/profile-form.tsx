'use client'

import { useState, type FormEvent } from 'react'
import { Input, Button, Card } from '@/components/ui'

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
  const [telefone, setTelefone] = useState(initialData.telefone)
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
          nome, email, telefone,
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
      setMessage({ type: 'error', text: 'Erro de conexao. Tente novamente.' })
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
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            error={errors.telefone}
            hint="Com DDD. Ex: (77) 99999-0000"
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
              label="Numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              error={errors.numero}
            />
            <div className="col-span-2">
              <Input
                label="Complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                error={errors.complemento}
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
              Salvar Alteracoes
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
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            hint="Minimo 8 caracteres"
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
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
