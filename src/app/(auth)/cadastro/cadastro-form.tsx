'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'

type TipoProponente = 'PF' | 'PJ' | 'MEI' | 'COLETIVO'

const tipoLabels: Record<TipoProponente, string> = {
  PF: 'Pessoa Física',
  PJ: 'Pessoa Jurídica',
  MEI: 'MEI',
  COLETIVO: 'Coletivo Cultural',
}

export function CadastroForm() {
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoProponente>('PF')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadWarning, setUploadWarning] = useState('')
  const [declaracaoFile, setDeclaracaoFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    password: '',
    confirmPassword: '',
  })
  const [loadingCep, setLoadingCep] = useState(false)

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUploadWarning('')

    // Validações básicas no client
    if (formData.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    if (!formData.cep || !formData.logradouro || !formData.bairro || !formData.cidade || !formData.uf) {
      setError('Preencha todos os campos de endereco obrigatorios.')
      return
    }

    const docLimpo = formData.cpfCnpj.replace(/\D/g, '')

    if (tipo === 'PF' && docLimpo.length !== 11) {
      setError('CPF deve ter 11 dígitos.')
      return
    }

    if (['PJ', 'MEI'].includes(tipo) && docLimpo.length !== 14) {
      setError('CNPJ deve ter 14 dígitos.')
      return
    }

    // Validação da declaração do coletivo
    if (tipo === 'COLETIVO' && !declaracaoFile) {
      setError('Declaração do coletivo é obrigatória.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          cpfCnpj: docLimpo,
          email: formData.email,
          telefone: formData.telefone,
          cep: formData.cep.replace(/\D/g, ''),
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          uf: formData.uf,
          password: formData.password,
          tipoProponente: tipo,
        }),
      })

      const registerData = await res.json()

      if (!res.ok) {
        setError(registerData.message || 'Erro ao criar conta.')
        return
      }

      // Upload da declaração do coletivo (etapa separada após criação do usuário)
      if (tipo === 'COLETIVO' && declaracaoFile) {
        const userId = registerData.userId

        try {
          const uploadForm = new FormData()
          uploadForm.append('file', declaracaoFile)
          uploadForm.append('userId', userId)

          const uploadRes = await fetch('/api/auth/register/upload-declaracao', {
            method: 'POST',
            body: uploadForm,
          })

          if (!uploadRes.ok) {
            const uploadData = await uploadRes.json()
            setUploadWarning(
              uploadData.message || 'Conta criada, mas não foi possível enviar a declaração. Envie posteriormente.'
            )
            // Não bloqueia o cadastro — segue para login com aviso
            router.push('/login?cadastro=sucesso')
            return
          }
        } catch {
          setUploadWarning(
            'Conta criada, mas não foi possível enviar a declaração. Envie posteriormente.'
          )
          router.push('/login?cadastro=sucesso')
          return
        }
      }

      router.push('/login?cadastro=sucesso')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCepBlur() {
    const cepLimpo = formData.cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }))
      }
    } catch { /* silencioso — usuario preenche manualmente */ }
    finally { setLoadingCep(false) }
  }

  const UF_OPTIONS = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
  ]

  const isCnpj = tipo === 'PJ' || tipo === 'MEI'

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Seleção do tipo */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 mb-2">
          Tipo de proponente
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(tipoLabels) as [TipoProponente, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipo(value)}
              className={[
                'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                tipo === value
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
              aria-pressed={tipo === value}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <Input
        label={isCnpj ? 'Razão Social' : 'Nome completo'}
        type="text"
        placeholder={isCnpj ? 'Razão Social da empresa' : 'Seu nome completo'}
        value={formData.nome}
        onChange={(e) => updateField('nome', e.target.value)}
        required
        autoComplete="name"
      />

      <Input
        label={isCnpj ? 'CNPJ' : 'CPF'}
        type="text"
        placeholder={isCnpj ? '00.000.000/0000-00' : '000.000.000-00'}
        value={formData.cpfCnpj}
        onChange={(e) => updateField('cpfCnpj', e.target.value)}
        required
        autoComplete={isCnpj ? 'off' : 'off'}
      />

      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
        required
        autoComplete="email"
      />

      <Input
        label="Telefone"
        type="tel"
        placeholder="(74) 99999-0000"
        value={formData.telefone}
        onChange={(e) => updateField('telefone', e.target.value)}
        required
        autoComplete="tel"
      />

      {/* Endereco */}
      <fieldset className="space-y-4 pt-2">
        <legend className="block text-sm font-medium text-slate-700 mb-2">
          Endereco
        </legend>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Input
              label="CEP"
              type="text"
              placeholder="00000-000"
              value={formData.cep}
              onChange={(e) => updateField('cep', e.target.value)}
              onBlur={handleCepBlur}
              required
              hint={loadingCep ? 'Buscando...' : undefined}
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Logradouro"
              type="text"
              placeholder="Rua, Avenida, etc."
              value={formData.logradouro}
              onChange={(e) => updateField('logradouro', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Numero"
            type="text"
            placeholder="123"
            value={formData.numero}
            onChange={(e) => updateField('numero', e.target.value)}
          />
          <div className="col-span-2">
            <Input
              label="Complemento"
              type="text"
              placeholder="Apto, Sala, etc."
              value={formData.complemento}
              onChange={(e) => updateField('complemento', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Bairro"
            type="text"
            placeholder="Bairro"
            value={formData.bairro}
            onChange={(e) => updateField('bairro', e.target.value)}
            required
          />
          <Input
            label="Cidade"
            type="text"
            placeholder="Cidade"
            value={formData.cidade}
            onChange={(e) => updateField('cidade', e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">UF</label>
            <select
              value={formData.uf}
              onChange={(e) => updateField('uf', e.target.value)}
              required
              className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus-visible:outline-none"
            >
              <option value="">UF</option>
              {UF_OPTIONS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Declaração do coletivo — exibido apenas para COLETIVO */}
      {tipo === 'COLETIVO' && (
        <div className="w-full">
          <label
            htmlFor="declaracao-coletivo"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Declaração do Coletivo (PDF)
            <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          <input
            id="declaracao-coletivo"
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setDeclaracaoFile(file)
            }}
            className={[
              'block w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'min-h-[44px]',
              'border-slate-300 focus:border-brand-500 focus:ring-brand-200',
              'file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5',
              'file:text-sm file:font-medium file:text-brand-700 file:cursor-pointer',
              'hover:file:bg-brand-100',
            ].join(' ')}
          />
          <p className="mt-1.5 text-sm text-slate-500">
            Documento que comprova a existência e representação do coletivo.
          </p>
        </div>
      )}

      <Input
        label="Senha"
        type="password"
        placeholder="Mínimo 8 caracteres"
        value={formData.password}
        onChange={(e) => updateField('password', e.target.value)}
        required
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres"
      />

      <Input
        label="Confirmar senha"
        type="password"
        placeholder="Repita a senha"
        value={formData.confirmPassword}
        onChange={(e) => updateField('confirmPassword', e.target.value)}
        required
        autoComplete="new-password"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {uploadWarning && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700" role="status">
          {uploadWarning}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Criar conta
      </Button>

      <p className="text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
          Entrar
        </Link>
      </p>
    </form>
  )
}
