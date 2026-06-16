'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@client/components/ui'
import { unmaskTelefone, unmaskCep } from '@shared/utils/format'
import { autenticacaoClient } from '@client/api/autenticacao.client'
import type { TipoProponente } from './cadastro-form/types'
import { TipoProponenteField } from './cadastro-form/tipo-proponente-field'
import { DadosProponenteFields } from './cadastro-form/dados-proponente-fields'
import { EnderecoFields } from './cadastro-form/endereco-fields'
import { DeclaracaoColetivoField } from './cadastro-form/declaracao-coletivo-field'
import { SenhaFields } from './cadastro-form/senha-fields'

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
  const [loadingCnpj, setLoadingCnpj] = useState(false)
  const [cnpjHint, setCnpjHint] = useState('')

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
      setError('Preencha todos os campos de endereço obrigatórios.')
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
      let registerData
      try {
        registerData = await autenticacaoClient.cadastrar({
          nome: formData.nome,
          cpfCnpj: docLimpo,
          email: formData.email,
          telefone: unmaskTelefone(formData.telefone),
          cep: unmaskCep(formData.cep),
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          uf: formData.uf,
          password: formData.password,
          tipoProponente: tipo,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
        return
      }

      // Upload da declaração do coletivo (etapa separada após criação do usuário)
      if (tipo === 'COLETIVO' && declaracaoFile) {
        const userId = registerData.usuario.id

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

  async function handleCnpjBlur() {
    if (!isCnpj) return
    const digits = formData.cpfCnpj.replace(/\D/g, '')
    if (digits.length !== 14) return

    setLoadingCnpj(true)
    setCnpjHint('')

    try {
      const res = await fetch('/api/cnpj/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: digits }),
      })

      if (res.status === 404) {
        setCnpjHint('CNPJ não encontrado na Receita. Preencha manualmente.')
        return
      }
      if (!res.ok) {
        setCnpjHint('Não foi possível consultar agora. Preencha manualmente.')
        return
      }

      const json = await res.json()
      const data = json.data as {
        razaoSocial: string
        situacao: string
        endereco: {
          cep: string | null
          logradouro: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          municipio: string | null
          uf: string | null
        }
      }

      setFormData((prev) => ({
        ...prev,
        nome: prev.nome || data.razaoSocial || prev.nome,
        cep: prev.cep || data.endereco.cep || prev.cep,
        logradouro: prev.logradouro || data.endereco.logradouro || prev.logradouro,
        numero: prev.numero || data.endereco.numero || prev.numero,
        complemento: prev.complemento || data.endereco.complemento || prev.complemento,
        bairro: prev.bairro || data.endereco.bairro || prev.bairro,
        cidade: prev.cidade || data.endereco.municipio || prev.cidade,
        uf: prev.uf || data.endereco.uf || prev.uf,
      }))

      if (data.situacao && data.situacao !== 'ATIVA') {
        setCnpjHint(`Atenção: situação na Receita é "${data.situacao}".`)
      }
    } catch {
      setCnpjHint('Não foi possível consultar agora. Preencha manualmente.')
    } finally {
      setLoadingCnpj(false)
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

  const isCnpj = tipo === 'PJ' || tipo === 'MEI'

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <TipoProponenteField tipo={tipo} onChange={setTipo} />

      <DadosProponenteFields
        formData={formData}
        updateField={updateField}
        isCnpj={isCnpj}
        loadingCnpj={loadingCnpj}
        cnpjHint={cnpjHint}
        onCnpjBlur={handleCnpjBlur}
      />

      <EnderecoFields
        formData={formData}
        updateField={updateField}
        loadingCep={loadingCep}
        onCepBlur={handleCepBlur}
      />

      {/* Declaração do coletivo — exibido apenas para COLETIVO */}
      {tipo === 'COLETIVO' && (
        <DeclaracaoColetivoField onFileChange={setDeclaracaoFile} />
      )}

      <SenhaFields formData={formData} updateField={updateField} />

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
