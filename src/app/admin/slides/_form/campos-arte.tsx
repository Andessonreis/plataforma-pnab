'use client'

import { ImageUpload } from '@/components/ui'
import { LIMITES_SLIDE } from '@/lib/schemas/slide-destaque'
import { CampoContado } from './campo-contado'
import { Secao } from './secao'
import type { ControleSlide } from './use-slide-form'

/** Campos da arte pronta: a imagem, o texto da barra de baixo e o botão. */
export function CamposArte({ form, erros, campo }: ControleSlide) {
  return (
    <Secao titulo="Arte" descricao="A imagem aparece inteira, sem cortes, ao lado da lista de editais.">
      <ImageUpload
        label="Imagem da arte"
        value={form.imagemUrl}
        onChange={(url) => campo('imagemUrl', url)}
        pasta="slides"
        hint="JPG, PNG ou WEBP, até 5 MB. Formato deitado (16:10) ocupa melhor o espaço."
      />
      {erros.imagemUrl && <p className="text-sm text-red-600">{erros.imagemUrl}</p>}
      <CampoContado
        id="slide-descricao"
        label="Texto de apoio"
        valor={form.descricao}
        onChange={(v) => campo('descricao', v)}
        max={LIMITES_SLIDE.descricaoArte}
        erro={erros.descricao}
        dica="Aparece em uma linha abaixo da arte"
        multilinha
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoContado
          id="slide-cta-label"
          label="Texto do botão"
          valor={form.ctaLabel}
          onChange={(v) => campo('ctaLabel', v)}
          max={LIMITES_SLIDE.ctaLabel}
          erro={erros.ctaLabel}
          placeholder="Saiba mais"
        />
        <CampoContado
          id="slide-cta-url"
          label="Link do botão"
          valor={form.ctaUrl}
          onChange={(v) => campo('ctaUrl', v)}
          max={LIMITES_SLIDE.link}
          erro={erros.ctaUrl}
          placeholder="/editais/nome-do-edital"
        />
      </div>
    </Secao>
  )
}
