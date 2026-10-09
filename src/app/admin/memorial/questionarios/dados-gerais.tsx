'use client'

import { Card, Input, Textarea } from '@/components/ui'
import { generateSimpleSlug } from '@/lib/utils/slug'
import type { CampoFormulario } from '@/types/campo-formulario'

export interface ValoresQuestionario {
  slug: string
  titulo: string
  descricao: string
  finalidade: string
  exigeLogin: boolean
  mensagemSucesso: string
  campos: CampoFormulario[]
}

interface DadosGeraisProps {
  valores: ValoresQuestionario
  erros: Record<string, string>
  /** Enquanto o endereço não foi editado à mão, ele acompanha o título. */
  slugAutomatico: boolean
  onChange: (patch: Partial<ValoresQuestionario>) => void
  onSlugManual: () => void
}

export function DadosGerais({ valores, erros, slugAutomatico, onChange, onSlugManual }: DadosGeraisProps) {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-slate-900">Dados do questionário</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Título"
          value={valores.titulo}
          required
          error={erros.titulo}
          onChange={(e) => {
            const titulo = e.target.value
            onChange(slugAutomatico ? { titulo, slug: generateSimpleSlug(titulo).slice(0, 80) } : { titulo })
          }}
        />
        <Input
          label="Endereço público"
          value={valores.slug}
          required
          error={erros.slug}
          hint={`Fica em /questionarios/${valores.slug || '...'}`}
          onChange={(e) => {
            onSlugManual()
            onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
          }}
        />
        <div className="sm:col-span-2">
          <Input
            label="Finalidade"
            value={valores.finalidade}
            required
            error={erros.finalidade}
            hint="Agrupa questionários do mesmo uso. O agendamento do Memorial usa memorial-agendamento."
            onChange={(e) => onChange({ finalidade: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
          />
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <Textarea
          label="Apresentação (opcional)"
          value={valores.descricao}
          error={erros.descricao}
          rows={3}
          hint="Aparece no topo da página, abaixo do título."
          onChange={(e) => onChange({ descricao: e.target.value })}
        />
        <Textarea
          label="Mensagem depois do envio (opcional)"
          value={valores.mensagemSucesso}
          error={erros.mensagemSucesso}
          rows={2}
          hint="Mostrada junto do protocolo. Sem mensagem, aparece um agradecimento padrão."
          onChange={(e) => onChange({ mensagemSucesso: e.target.value })}
        />
        <label className="flex min-h-[44px] items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={valores.exigeLogin}
            onChange={(e) => onChange({ exigeLogin: e.target.checked })}
            className="h-5 w-5 rounded border-slate-400 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          Só quem tem conta no portal pode responder
        </label>
      </div>
    </Card>
  )
}
