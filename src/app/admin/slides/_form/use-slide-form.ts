'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { slideSchema } from '@/lib/schemas/slide-destaque'
import { formVazio, payloadDoForm, type FormPeca, type FormSlide } from './estado'

export type ErrosSlide = Record<string, string>

/**
 * Estado e envio do formulário de slide. Valida no navegador com o mesmo
 * `slideSchema` da API antes de enviar, para o erro aparecer no campo sem ida
 * ao servidor; as chaves dos erros são os caminhos do schema
 * (`peca.chamada`, `peca.varal.anoFinal`...), iguais aos que a API devolve.
 */
export function useSlideForm(inicial: FormSlide | undefined, slideId: string | undefined) {
  const router = useRouter()
  const [form, setForm] = useState<FormSlide>(inicial ?? formVazio())
  const [erros, setErros] = useState<ErrosSlide>({})
  const [salvando, setSalvando] = useState(false)

  const campo = <K extends keyof FormSlide>(chave: K, valor: FormSlide[K]) =>
    setForm((atual) => ({ ...atual, [chave]: valor }))
  const campoPeca = <K extends keyof FormPeca>(chave: K, valor: FormPeca[K]) =>
    setForm((atual) => ({ ...atual, peca: { ...atual.peca, [chave]: valor } }))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const corpo = payloadDoForm(form)

    const local = slideSchema.safeParse(corpo)
    if (!local.success) {
      setErros(Object.fromEntries(local.error.issues.map((i) => [i.path.join('.'), i.message])))
      toast({ variant: 'destructive', title: 'Verifique os campos destacados' })
      return
    }

    setSalvando(true)
    setErros({})
    try {
      const res = await fetch(slideId ? `/api/admin/slides/${slideId}` : '/api/admin/slides', {
        method: slideId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.fieldErrors) setErros(data.fieldErrors)
        toast({
          variant: 'destructive',
          title: data.fieldErrors ? 'Verifique os campos destacados' : 'Erro ao salvar slide',
          description: data.fieldErrors ? undefined : data.message || 'Tente novamente em instantes.',
        })
        return
      }

      toast({ title: slideId ? 'Slide atualizado' : 'Slide criado com sucesso' })
      if (slideId) router.refresh()
      else router.push(`/admin/slides/${data.id}`)
    } catch {
      toast({ variant: 'destructive', title: 'Erro de conexão', description: 'Verifique sua internet e tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  return { form, erros, salvando, campo, campoPeca, salvar }
}

export type ControleSlide = ReturnType<typeof useSlideForm>
