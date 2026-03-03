'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'

interface ContactFormProps {
  editais: { id: string; titulo: string }[]
}

export function ContactForm({ editais }: ContactFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [protocolo, setProtocolo] = useState('')
  const [formData, setFormData] = useState({
    nomeContato: '',
    emailContato: '',
    editalId: '',
    assunto: '',
    mensagem: '',
  })

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setProtocolo('')

    // Validacao basica no client
    if (!formData.nomeContato.trim()) {
      setError('Informe seu nome.')
      return
    }
    if (!formData.emailContato.trim() || !formData.emailContato.includes('@')) {
      setError('Informe um e-mail valido.')
      return
    }
    if (!formData.assunto.trim()) {
      setError('Informe o assunto da mensagem.')
      return
    }
    if (!formData.mensagem.trim() || formData.mensagem.trim().length < 10) {
      setError('A mensagem deve ter no minimo 10 caracteres.')
      return
    }

    setLoading(true)

    try {
      const body: Record<string, string> = {
        nomeContato: formData.nomeContato.trim(),
        emailContato: formData.emailContato.trim(),
        assunto: formData.assunto.trim(),
        mensagem: formData.mensagem.trim(),
      }

      if (formData.editalId) {
        body.editalId = formData.editalId
      }

      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro ao enviar mensagem. Tente novamente.')
        return
      }

      setProtocolo(data.protocolo)
      // Limpa o formulario
      setFormData({
        nomeContato: '',
        emailContato: '',
        editalId: '',
        assunto: '',
        mensagem: '',
      })
    } catch {
      setError('Erro de conexao. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Mensagem de sucesso
  if (protocolo) {
    return (
      <div className="rounded-xl bg-brand-50 border border-brand-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-brand-800">
          Mensagem enviada com sucesso!
        </h3>
        <p className="mt-2 text-sm text-brand-700">
          Seu numero de protocolo e:
        </p>
        <p className="mt-2 text-2xl font-bold text-brand-900 font-mono tracking-wider">
          {protocolo}
        </p>
        <p className="mt-4 text-sm text-brand-600">
          Guarde este numero para acompanhar o atendimento. Voce tambem recebera uma
          confirmacao no e-mail informado.
        </p>
        <button
          type="button"
          onClick={() => setProtocolo('')}
          className="mt-6 inline-flex items-center justify-center rounded-lg border-2 border-brand-600 text-brand-700 px-6 py-2.5 text-sm font-medium hover:bg-brand-100 transition-colors min-h-[44px]"
        >
          Enviar nova mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="Nome completo"
        type="text"
        placeholder="Seu nome"
        value={formData.nomeContato}
        onChange={(e) => updateField('nomeContato', e.target.value)}
        required
        autoComplete="name"
      />

      <Input
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={formData.emailContato}
        onChange={(e) => updateField('emailContato', e.target.value)}
        required
        autoComplete="email"
      />

      {/* Edital relacionado (opcional) */}
      {editais.length > 0 && (
        <div className="w-full">
          <label
            htmlFor="edital-select"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Edital relacionado <span className="text-slate-400">(opcional)</span>
          </label>
          <select
            id="edital-select"
            value={formData.editalId}
            onChange={(e) => updateField('editalId', e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200 min-h-[44px] bg-white"
          >
            <option value="">Nenhum edital especifico</option>
            {editais.map((edital) => (
              <option key={edital.id} value={edital.id}>
                {edital.titulo}
              </option>
            ))}
          </select>
        </div>
      )}

      <Input
        label="Assunto"
        type="text"
        placeholder="Resumo da sua mensagem"
        value={formData.assunto}
        onChange={(e) => updateField('assunto', e.target.value)}
        required
      />

      {/* Mensagem (textarea) */}
      <div className="w-full">
        <label
          htmlFor="mensagem"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Mensagem <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
        </label>
        <textarea
          id="mensagem"
          rows={5}
          placeholder="Descreva sua duvida ou solicitacao com detalhes..."
          value={formData.mensagem}
          onChange={(e) => updateField('mensagem', e.target.value)}
          required
          className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200 resize-y min-h-[120px]"
        />
        <p className="mt-1.5 text-sm text-slate-500">
          Minimo de 10 caracteres
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Enviar mensagem
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Ao enviar, voce recebera um numero de protocolo para acompanhamento.
        Respeitamos limites de envio para garantir a qualidade do atendimento.
      </p>
    </form>
  )
}
