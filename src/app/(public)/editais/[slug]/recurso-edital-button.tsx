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
import { IconCheck } from '@/components/ui/icons'

interface RecursoEditalButtonProps {
  slug: string
}

/**
 * Recurso contra o edital, aberto na janela do próprio cronograma.
 *
 * O rótulo do gatilho já foi "Publicação do Edital" — descrevia o marco do
 * cronograma que abre a janela, não a ação do botão. Quem lê "recurso contra
 * o edital" sabe o que vai encontrar ao clicar; o nome do marco fica só como
 * contexto no cronograma, que é de onde este botão nasce.
 */
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
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
        >
          Recurso contra o edital
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-none border-2 border-tinta-900 bg-papel-50 shadow-[6px_6px_0_0_theme(colors.tinta.900/0.15)] sm:max-w-lg">
        {protocolo ? (
          <div className="py-4 text-center">
            <IconCheck className="mx-auto h-12 w-12 text-oliva-700" aria-hidden="true" />
            <h3 className="titulo mt-4 text-xl tracking-wide text-tinta-900">
              Recurso interposto com sucesso
            </h3>
            <p className="mt-2 text-sm text-tinta-600">Seu número de protocolo é:</p>
            <p className="titulo mt-2 text-2xl tracking-wide text-brand-700">{protocolo}</p>
            <p className="mt-4 text-sm text-tinta-500">
              Guarde este número para acompanhar. Você também receberá uma confirmação no e-mail informado.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="titulo text-xl tracking-wide text-tinta-900">
                Recurso contra o edital
              </DialogTitle>
              <DialogDescription className="text-tinta-600">
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
                <label htmlFor="motivo-recurso" className="mb-1.5 block text-sm font-medium text-tinta-700">
                  Motivo do recurso <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="motivo-recurso"
                  rows={5}
                  placeholder="Descreva o motivo do recurso contra o edital..."
                  value={formData.motivo}
                  onChange={(e) => updateField('motivo', e.target.value)}
                  required
                  className="block min-h-[120px] w-full resize-y border border-tinta-900/30 px-3 py-2.5 text-sm text-tinta-900 placeholder:text-tinta-400 transition-colors focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-300"
                />
                <p className="mt-1.5 text-sm text-tinta-500">Mínimo de 20 caracteres</p>
              </div>

              {error && (
                <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" loading={loading} className="w-full rounded-none bg-accent-500 text-tinta-950 hover:bg-accent-400 focus-visible:ring-tinta-900">
                Enviar recurso
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
