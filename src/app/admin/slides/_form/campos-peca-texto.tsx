'use client'

import { LIMITES_SLIDE as L } from '@/lib/schemas/slide-destaque'
import { CampoContado } from './campo-contado'
import { Secao } from './secao'
import type { ControleSlide } from './use-slide-form'

/** Textos e botões da peça editorial, na ordem em que aparecem no quadro. */
export function CamposPecaTexto({ form, erros, campo, campoPeca }: ControleSlide) {
  const p = form.peca
  return (
    <>
      <Secao titulo="Chamada" descricao="A frase grande da peça. A segunda parte aparece em dourado, numa linha própria.">
        <CampoContado id="peca-chamada" label="Chamada" valor={p.chamada} onChange={(v) => campoPeca('chamada', v)}
          max={L.chamada} erro={erros['peca.chamada']} placeholder="Tudo que a memória amou" obrigatorio />
        <CampoContado id="peca-chamada-destaque" label="Continuação em destaque" valor={p.chamadaDestaque}
          onChange={(v) => campoPeca('chamadaDestaque', v)} max={L.chamadaDestaque}
          erro={erros['peca.chamadaDestaque']} placeholder="já ficou eterno." />
        <CampoContado id="peca-autoria" label="Autoria da frase" valor={p.autoria} onChange={(v) => campoPeca('autoria', v)}
          max={L.autoria} erro={erros['peca.autoria']} dica="Deixe em branco se a frase não for citação" />
      </Secao>

      <Secao titulo="Texto de apoio">
        <CampoContado id="peca-apoio-destaque" label="Nome em destaque" valor={p.apoioDestaque}
          onChange={(v) => campoPeca('apoioDestaque', v)} max={L.apoioDestaque}
          erro={erros['peca.apoioDestaque']} placeholder="Memorial de Irecê." dica="Abre o texto, em dourado" />
        <CampoContado id="peca-apoio" label="Texto" valor={form.descricao} onChange={(v) => campo('descricao', v)}
          max={L.apoio} erro={erros.descricao} multilinha />
        {p.linhas.map((linha, i) => (
          <CampoContado key={i} id={`peca-linha-${i}`} label={`Informação curta ${i + 1}`} valor={linha}
            onChange={(v) => {
              const linhas = [...p.linhas] as typeof p.linhas
              linhas[i] = v
              campoPeca('linhas', linhas)
            }}
            max={L.linha} erro={erros[`peca.linhas.${i}`]}
            dica={i === 0 ? 'Opcional. Ex.: regras de visita, o que está em cartaz' : undefined} />
        ))}
      </Secao>

      <Secao titulo="Botões" descricao="O primeiro é o destaque dourado; o segundo é opcional.">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoContado id="peca-cta-label" label="Texto do botão principal" valor={form.ctaLabel}
            onChange={(v) => campo('ctaLabel', v)} max={L.ctaLabel} erro={erros.ctaLabel} obrigatorio />
          <CampoContado id="peca-cta-url" label="Link do botão principal" valor={form.ctaUrl}
            onChange={(v) => campo('ctaUrl', v)} max={L.link} erro={erros.ctaUrl} placeholder="/memorial/agendar" obrigatorio />
          <CampoContado id="peca-cta2-label" label="Texto do segundo botão" valor={p.ctaSecundarioLabel}
            onChange={(v) => campoPeca('ctaSecundarioLabel', v)} max={L.ctaLabel} erro={erros['peca.ctaSecundario.label']} />
          <CampoContado id="peca-cta2-url" label="Link do segundo botão" valor={p.ctaSecundarioUrl}
            onChange={(v) => campoPeca('ctaSecundarioUrl', v)} max={L.link} erro={erros['peca.ctaSecundario.url']} placeholder="/memorial" />
        </div>
      </Secao>
    </>
  )
}
