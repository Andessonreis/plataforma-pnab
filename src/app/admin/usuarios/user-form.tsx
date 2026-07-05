'use client'

import { useState, type FormEvent } from 'react'
import { Input, Button, Select } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

const roleOptions = [
  { value: 'PROPONENTE', label: 'Proponente' },
  { value: 'ATENDIMENTO', label: 'Atendimento' },
  { value: 'HABILITADOR', label: 'Habilitador' },
  { value: 'AVALIADOR', label: 'Avaliador' },
  { value: 'ADMIN', label: 'Administrador' },
]

const tipoProponenteOptions = [
  { value: 'PF', label: 'Pessoa Física' },
  { value: 'PJ', label: 'Pessoa Jurídica' },
  { value: 'MEI', label: 'MEI' },
  { value: 'COLETIVO', label: 'Coletivo' },
]

interface UserFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ onSuccess, onCancel }: UserFormProps) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [role, setRole] = useState('')
  const [tipoProponente, setTipoProponente] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'As senhas não coincidem.' })
      return
    }

    setLoading(true)
    setErrors({})

    const body = {
      nome,
      email,
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
      telefone: telefone || undefined,
      role,
      tipoProponente: role === 'PROPONENTE' ? tipoProponente || undefined : undefined,
      password,
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
          toast({
            variant: 'destructive',
            title: 'Verifique os campos do formulário',
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao criar usuário',
            description: data.message || 'Tente novamente em instantes.',
          })
        }
        return
      }

      toast({ title: 'Usuário criado com sucesso' })
      onSuccess()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Verifique sua internet e tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome completo"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        error={errors.nome}
        required
        placeholder="Ex: Maria da Silva"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="CPF/CNPJ"
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(e.target.value)}
          error={errors.cpfCnpj}
          required
          placeholder="Somente números"
          hint="Usado para fazer login no portal"
          inputMode="numeric"
        />

        <Input
          label="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          error={errors.telefone}
          placeholder="(74) 99999-9999"
          hint="Opcional"
        />
      </div>

      <Input
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
        placeholder="usuario@exemplo.com"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Perfil de acesso"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          error={errors.role}
          required
          placeholder="Selecione o perfil..."
          options={roleOptions}
        />

        {role === 'PROPONENTE' && (
          <Select
            label="Tipo de proponente"
            value={tipoProponente}
            onChange={(e) => setTipoProponente(e.target.value)}
            error={errors.tipoProponente}
            required
            placeholder="Selecione o tipo..."
            options={tipoProponenteOptions}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          hint="Mín. 8 caracteres, com maiúscula, minúscula, número e especial"
          autoComplete="new-password"
        />

        <Input
          label="Confirmar senha"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Criar Usuário
        </Button>
      </div>
    </form>
  )
}
