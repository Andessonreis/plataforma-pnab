'use client'

import { useState, type FormEvent } from 'react'
import { formatTelefoneBR, unmaskTelefone } from '@/lib/utils/format'

export interface PersonalDataInitial {
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

type FormMessage = { type: 'success' | 'error'; text: string }

/** Estado e submissão dos dados pessoais + endereço. Separado da senha porque
 * são dois PUTs independentes em /api/proponente/perfil, com seu próprio
 * loading e mensagem de resultado. */
export function usePersonalDataForm(initialData: PersonalDataInitial) {
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

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<FormMessage | null>(null)
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
    } catch {
      /* silencioso — CEP inválido não bloqueia o preenchimento manual */
    } finally {
      setLoadingCep(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setErrors({})

    try {
      const res = await fetch('/api/proponente/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          telefone: unmaskTelefone(telefone),
          cep: cep.replace(/\D/g, ''),
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
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

  return {
    values: { nome, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf },
    setters: {
      setNome, setEmail, setTelefone, setCep, setLogradouro,
      setNumero, setComplemento, setBairro, setCidade, setUf,
    },
    loadingCep,
    loading,
    message,
    errors,
    handleCepBlur,
    handleSubmit,
  }
}
