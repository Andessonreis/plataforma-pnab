'use client'

import { generateSimpleSlug } from '@/lib/utils/slug'
import { CampoArea, CampoMarcar, CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { EscolherFinalidade } from './escolher-finalidade'
import type { ValoresQuestionario } from './valores'

interface Props {
  valores: ValoresQuestionario
  erros: Record<string, string>
  /** Enquanto o endereço não foi editado à mão, ele acompanha o título. */
  slugAutomatico: boolean
  onChange: (patch: Partial<ValoresQuestionario>) => void
  onSlugManual: () => void
}

/** Título, para que serve e textos da página do questionário. */
export function DadosGerais({ valores, erros, slugAutomatico, onChange, onSlugManual }: Props) {
  return (
    <section aria-labelledby="sobre-titulo" className="space-y-4 rounded-xl border border-tinta-900/10 bg-white p-4 sm:p-5">
      <h2 id="sobre-titulo" className="text-base font-bold text-tinta-900">Sobre o questionário</h2>
      <CampoTexto
        rotulo="Título"
        required
        value={valores.titulo}
        erro={erros.titulo}
        dica="É o que o público vê no topo da página."
        onChange={(e) => {
          const titulo = e.target.value
          onChange(slugAutomatico ? { titulo, slug: generateSimpleSlug(titulo).slice(0, 80) } : { titulo })
        }}
      />
      <EscolherFinalidade valor={valores.finalidade} erro={erros.finalidade} onChange={(finalidade) => onChange({ finalidade })} />
      <CampoArea
        rotulo="Texto de abertura"
        rows={3}
        value={valores.descricao}
        erro={erros.descricao}
        dica="Opcional. Aparece abaixo do título, antes das perguntas."
        onChange={(e) => onChange({ descricao: e.target.value })}
      />
      <div className="grid gap-4 2xl:grid-cols-2">
        <CampoArea
          rotulo="Mensagem depois do envio"
          rows={2}
          value={valores.mensagemSucesso}
          erro={erros.mensagemSucesso}
          dica="Opcional. Sem ela, aparece um agradecimento padrão junto do protocolo."
          onChange={(e) => onChange({ mensagemSucesso: e.target.value })}
        />
        <CampoTexto
          rotulo="Endereço da página"
          required
          value={valores.slug}
          erro={erros.slug}
          dica={`Fica em /questionarios/${valores.slug || '…'}`}
          onChange={(e) => {
            onSlugManual()
            onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
          }}
        />
      </div>
      <CampoMarcar
        rotulo="Só quem tem conta no portal pode responder"
        dica="Deixe desmarcado para qualquer pessoa conseguir responder."
        checked={valores.exigeLogin}
        onChange={(e) => onChange({ exigeLogin: e.target.checked })}
      />
    </section>
  )
}
