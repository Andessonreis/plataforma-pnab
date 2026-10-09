'use client'

import { ImageUpload, Input } from '@/components/ui'
import { LIMITES_SLIDE as L, VARAL_QUANTIDADE } from '@/lib/schemas/slide-destaque'
import { CampoContado } from './campo-contado'
import { Secao } from './secao'
import type { ControleSlide } from './use-slide-form'

/** Imagens da peça e a faixa de fotografias opcional embaixo dela. */
export function CamposPecaMidia({ form, erros, campo, campoPeca }: ControleSlide) {
  const p = form.peca
  return (
    <>
      <Secao titulo="Imagens" descricao="O fundo ganha tom de sépia automaticamente. A foto colada aparece em cores, presa com fita.">
        <ImageUpload label="Imagem de fundo (obrigatória)" value={form.imagemUrl} onChange={(url) => campo('imagemUrl', url)}
          pasta="slides" hint="Foto deitada e ampla, de pelo menos 1600 px de largura. JPG, PNG ou WEBP, até 5 MB." />
        {erros.imagemUrl && <p className="text-sm text-red-600">{erros.imagemUrl}</p>}
        <ImageUpload label="Foto colada (opcional)" value={p.destaqueUrl} onChange={(url) => campoPeca('destaqueUrl', url)}
          pasta="slides" hint="Recortada em 3:2 pelo centro — deixe o assunto no meio da foto." />
        {p.destaqueUrl && (
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoContado id="peca-destaque-alt" label="Descrição da foto (para leitores de tela)" valor={p.destaqueAlt}
              onChange={(v) => campoPeca('destaqueAlt', v)} max={L.alt} erro={erros['peca.destaque.alt']}
              dica="O que a foto mostra" obrigatorio multilinha />
            <CampoContado id="peca-destaque-legenda" label="Legenda" valor={p.destaqueLegenda}
              onChange={(v) => campoPeca('destaqueLegenda', v)} max={L.legenda} erro={erros['peca.destaque.legenda']}
              placeholder="O Memorial, hoje" />
          </div>
        )}
      </Secao>

      <Secao titulo="Faixa de fotografias" descricao="Um varal de fotos penduradas ao longo de um período, com o texto acima.">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
          <input type="checkbox" checked={p.temVaral} onChange={(e) => campoPeca('temVaral', e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 accent-brand-600" />
          <span className="text-sm font-medium text-slate-700">Mostrar a faixa de fotografias</span>
        </label>
        {p.temVaral && (
          <>
            <CampoContado id="peca-varal-rotulo" label="Texto da faixa" valor={p.varalRotulo}
              onChange={(v) => campoPeca('varalRotulo', v)} max={L.varalRotulo} erro={erros['peca.varal.rotulo']}
              placeholder="Re-Tratos do Tempo: 28 fotografias entre 1950 e 1980" obrigatorio />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="peca-varal-quantidade" label="Fotos no varal" type="number" inputMode="numeric"
                min={VARAL_QUANTIDADE.min} max={VARAL_QUANTIDADE.max} value={p.varalQuantidade}
                onChange={(e) => campoPeca('varalQuantidade', e.target.value)} error={erros['peca.varal.quantidade']}
                hint={`De ${VARAL_QUANTIDADE.min} a ${VARAL_QUANTIDADE.max}`} />
              <Input id="peca-varal-inicio" label="Ano inicial" type="number" inputMode="numeric" value={p.varalAnoInicial}
                onChange={(e) => campoPeca('varalAnoInicial', e.target.value)} error={erros['peca.varal.anoInicial']} />
              <Input id="peca-varal-fim" label="Ano final" type="number" inputMode="numeric" value={p.varalAnoFinal}
                onChange={(e) => campoPeca('varalAnoFinal', e.target.value)} error={erros['peca.varal.anoFinal']} />
            </div>
          </>
        )}
      </Secao>
    </>
  )
}
