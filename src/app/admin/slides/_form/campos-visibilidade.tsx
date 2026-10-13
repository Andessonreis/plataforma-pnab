'use client'

import { Input } from '@/components/ui'
import { LIMITES_SLIDE } from '@/lib/schemas/slide-destaque'
import { CampoContado } from './campo-contado'
import { Secao } from './secao'
import type { ControleSlide } from './use-slide-form'

/** Nome interno, ordem e janela de exibição — valem para os dois formatos. */
export function CamposVisibilidade({ form, erros, campo }: ControleSlide) {
  return (
    <Secao titulo="Publicação">
      <CampoContado id="slide-titulo" label="Nome do slide" valor={form.titulo} onChange={(v) => campo('titulo', v)}
        max={LIMITES_SLIDE.titulo} erro={erros.titulo} obrigatorio
        dica="Identifica o slide aqui no painel e é lido por leitores de tela" />
      <Input id="slide-ordem" label="Ordem de exibição" type="number" inputMode="numeric" value={String(form.ordem)}
        onChange={(e) => campo('ordem', Number(e.target.value))} error={erros.ordem}
        hint="Menor aparece primeiro. O slide dos editais é sempre o primeiro." />
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input type="checkbox" checked={form.ativo} onChange={(e) => campo('ativo', e.target.checked)}
          className="h-5 w-5 rounded border-slate-300 accent-brand-600" />
        <span className="text-sm font-medium text-slate-700">Slide ativo</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="slide-inicio" label="Exibir a partir de" type="datetime-local" value={form.inicioEm}
          onChange={(e) => campo('inicioEm', e.target.value)} error={erros.inicioEm}
          hint="Em branco: aparece assim que salvar" />
        <Input id="slide-fim" label="Exibir até" type="datetime-local" value={form.fimEm}
          onChange={(e) => campo('fimEm', e.target.value)} error={erros.fimEm}
          hint="Em branco: não sai sozinho" />
      </div>
    </Secao>
  )
}
