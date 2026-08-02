'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui'
import { useIsMobile } from '@/hooks/use-mobile'
import type { EditalArquivosHandle } from './edital-arquivos'
import {
  EditalFormProvider,
  useEditalForm,
  type EditalFormInitialData,
} from './edital-form/edital-form-context'
import { useEditalFormSections } from './edital-form/use-edital-form-sections'
import { buildEditalFormBody } from './edital-form/build-submit-payload'

export interface EditalFormProps {
  initialData?: EditalFormInitialData
}

export function EditalForm({ initialData }: EditalFormProps) {
  return (
    <EditalFormProvider initialData={initialData}>
      <EditalFormBody initialData={initialData} />
    </EditalFormProvider>
  )
}

function EditalFormBody({ initialData }: EditalFormProps) {
  const router = useRouter()
  const isEdit = !!initialData
  const isMobile = useIsMobile()
  const arquivosRef = useRef<EditalArquivosHandle>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useEditalForm()
  const sections = useEditalFormSections(initialData?.id, arquivosRef)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (form.cronogramaWarnings.length > 0) {
      setError('Corrija as datas fora de ordem no cronograma antes de salvar.')
      setLoading(false)
      return
    }

    const body = buildEditalFormBody(form)

    try {
      const url = isEdit ? `/api/admin/editais?id=${initialData!.id}` : '/api/admin/editais'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...body, id: initialData!.id } : body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? `Erro ${res.status}`)
      }

      const data = await res.json()
      const editalId: string = data.id ?? initialData?.id ?? ''

      if (arquivosRef.current?.hasPending()) {
        await arquivosRef.current.uploadPending(editalId)
      }

      router.push('/admin/editais')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isMobile ? (
        <Accordion type="single" collapsible defaultValue={sections[0].id} className="space-y-3">
          {sections.map((s) => (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionTrigger>{s.title}</AccordionTrigger>
              <AccordionContent>{s.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Tabs defaultValue={sections[0].id}>
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-slate-100 p-1.5">
            {sections.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="whitespace-nowrap">
                {s.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map((s) => (
            <TabsContent key={s.id} value={s.id}>
              <Card padding="sm" className="sm:p-6 mt-4">
                {s.content}
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/editais')}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || form.cronogramaWarnings.length > 0}
          title={form.cronogramaWarnings.length > 0 ? 'Corrija as datas fora de ordem no cronograma' : undefined}
          className="w-full sm:w-auto"
        >
          {loading ? (isEdit ? 'Salvando...' : 'Criando...') : isEdit ? 'Salvar alterações' : 'Criar edital'}
        </Button>
      </div>
    </form>
  )
}
