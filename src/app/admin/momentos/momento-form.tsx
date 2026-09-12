'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Button, Card, ImageUpload } from '@/components/ui'
import { toast } from '@/hooks/use-toast'

interface MomentoFormProps {
  initialData?: {
    id: string
    categoria: string
    imagemUrl: string
    instagramUrl: string
    ordem: number
    ativo: boolean
  }
  momentoId?: string
}

export function MomentoForm({ initialData, momentoId }: MomentoFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [categoria, setCategoria] = useState(initialData?.categoria ?? '')
  const [imagemUrl, setImagemUrl] = useState(initialData?.imagemUrl ?? '')
  const [instagramUrl, setInstagramUrl] = useState(initialData?.instagramUrl ?? '')
  const [ordem, setOrdem] = useState(initialData?.ordem ?? 0)
  const [ativo, setAtivo] = useState(initialData?.ativo ?? true)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    const body = { categoria, imagemUrl, instagramUrl, ordem, ativo }

    try {
      const url = isEdit ? `/api/admin/momentos/${momentoId}` : '/api/admin/momentos'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors)
          toast({ variant: 'destructive', title: 'Verifique os campos do formulário' })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar momento',
            description: data.message || 'Tente novamente em instantes.',
          })
        }
        return
      }

      toast({ title: isEdit ? 'Momento atualizado' : 'Momento criado com sucesso' })
      if (!isEdit) {
        router.push(`/admin/momentos/${data.id}`)
      }
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 sm:space-y-6">
      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Conteúdo</h2>
        <div className="space-y-4">
          <Input
            label="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            error={errors.categoria}
            required
            placeholder="Ex: Bem Viver, Criança Feliz, Trabalhos, Reuniões"
            hint="Nome do álbum/destaque, igual aos destaques do Instagram da Secretaria."
          />

          <ImageUpload
            label="Foto de capa"
            value={imagemUrl}
            onChange={setImagemUrl}
            pasta="momentos"
            hint="Foto de capa do momento. Arraste ou clique para selecionar. JPG, PNG ou WEBP, até 5 MB."
          />
          {errors.imagemUrl && <p className="text-sm text-red-600">{errors.imagemUrl}</p>}

          <Input
            label="Link da publicação no Instagram"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            error={errors.instagramUrl}
            required
            placeholder="https://www.instagram.com/p/..."
            hint="Ao clicar na foto na home, o visitante é levado para essa publicação."
          />
        </div>
      </Card>

      <Card padding="sm" className="sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Visibilidade</h2>
        <div className="space-y-4">
          <Input
            label="Ordem de Exibição"
            type="number"
            value={String(ordem)}
            onChange={(e) => setOrdem(Number(e.target.value))}
            error={errors.ordem}
            hint="Momentos são ordenados do menor para o maior"
          />

          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700">Momento ativo</span>
          </label>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/momentos')}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Salvar Alterações' : 'Criar Momento'}
        </Button>
      </div>
    </form>
  )
}
