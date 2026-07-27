'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button, Input } from '@/components/ui'

interface RecursoEditalButtonProps {
  slug: string
}

export function RecursoEditalButton({ slug }: RecursoEditalButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [protocolo, setProtocolo] = useState('')
  const [formData, setFormData] = useState({ nomeCompleto: '', email: '', telefone: '', motivo: '' })

  function updateField(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function reset() {
    setFormData({ nomeCompleto: '', email: '', telefone: '', motivo: '' })
    setProtocolo('')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.motivo.trim().length < 20) {
      setError('O motivo do recurso deve ter no mínimo 20 caracteres.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/editais/${slug}/recurso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Erro ao enviar recurso. Tente novamente.')
        return
      }

      setProtocolo(data.protocolo)
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Publicação do Edital
        </button>
      </DialogTrigger>

      <DialogContent className="bg-white sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {protocolo ? (
          <div className="text-center py-4">
            <svg className="mx-auto h-12 w-12 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-brand-800">Recurso interposto com sucesso</h3>
            <p className="mt-2 text-sm text-slate-600">Seu número de protocolo é:</p>
            <p className="mt-2 text-2xl font-bold text-brand-900 font-mono tracking-wider">{protocolo}</p>
            <p className="mt-4 text-sm text-slate-500">
              Guarde este número para acompanhar. Você também receberá uma confirmação no e-mail informado.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-slate-900">Publicação do Edital</DialogTitle>
              <DialogDescription className="text-slate-600">
                Use este formulário para contestar as regras ou termos deste edital dentro do prazo previsto no cronograma.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Nome completo"
                type="text"
                value={formData.nomeCompleto}
                onChange={(e) => updateField('nomeCompleto', e.target.value)}
                required
                autoComplete="name"
              />
              <Input
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="Telefone"
                type="tel"
                placeholder="(74) 90000-0000"
                value={formData.telefone}
                onChange={(e) => updateField('telefone', e.target.value)}
                required
                autoComplete="tel"
              />
              <div className="w-full">
                <label htmlFor="motivo-recurso" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Motivo do recurso <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="motivo-recurso"
                  rows={5}
                  placeholder="Descreva o motivo do recurso contra o edital..."
                  value={formData.motivo}
                  onChange={(e) => updateField('motivo', e.target.value)}
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-brand-500 focus:ring-brand-200 resize-y min-h-[120px]"
                />
                <p className="mt-1.5 text-sm text-slate-500">Mínimo de 20 caracteres</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Enviar recurso
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
