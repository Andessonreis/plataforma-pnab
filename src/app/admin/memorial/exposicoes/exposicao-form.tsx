'use client'

import type { FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { CampoImagem } from '../_componentes/campo-imagem'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { SecaoForm } from '../_componentes/secao-form'
import { SeletorVinculos } from '../_componentes/seletor-vinculos'
import { useCampos, useSalvar } from '../_componentes/use-envio'

export interface ExposicaoEditavel {
  id: string
  titulo: string
  slug: string
  subtitulo: string | null
  descricao: string | null
  periodo: string | null
  localizacao: string | null
  capaUrl: string | null
  dataInicio: Date | null
  dataFim: Date | null
  destaque: boolean
  ordem: number
  itens: { id: string }[]
  pessoas: { id: string }[]
  eventos: { id: string }[]
}

const dia = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

export function ExposicaoForm({ exposicao, opcoes }: { exposicao?: ExposicaoEditavel; opcoes: OpcoesDeVinculo }) {
  const { enviando, erros, recado, salvar } = useSalvar(
    '/api/v1/memorial/exposicoes',
    exposicao?.id,
    '/admin/memorial/exposicoes',
  )
  const { valores, definir, texto } = useCampos({
    titulo: exposicao?.titulo ?? '',
    slug: exposicao?.slug ?? '',
    subtitulo: exposicao?.subtitulo ?? '',
    descricao: exposicao?.descricao ?? '',
    periodo: exposicao?.periodo ?? '',
    localizacao: exposicao?.localizacao ?? '',
    capaUrl: exposicao?.capaUrl ?? null,
    dataInicio: dia(exposicao?.dataInicio ?? null),
    dataFim: dia(exposicao?.dataFim ?? null),
    destaque: exposicao?.destaque ?? false,
    ordem: exposicao?.ordem ?? 0,
    itemIds: exposicao?.itens.map((i) => i.id) ?? [],
    pessoaIds: exposicao?.pessoas.map((p) => p.id) ?? [],
    eventoIds: exposicao?.eventos.map((e) => e.id) ?? [],
  })

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <form onSubmit={enviar} className="max-w-3xl space-y-5" noValidate>
      <SecaoForm titulo="Apresentação">
        <Input label="Título" required error={erros.titulo} {...texto('titulo')} />
        <Input label="Subtítulo" error={erros.subtitulo} {...texto('subtitulo')} />
        <Textarea
          label="Texto da exposição"
          hint="Aceita **negrito**, *itálico*, listas e subtítulos com ##."
          rows={10}
          error={erros.descricao}
          {...texto('descricao')}
        />
        <CampoImagem label="Imagem de capa" pasta="exposicoes" value={valores.capaUrl} onChange={(u) => definir('capaUrl', u)} />
      </SecaoForm>

      <SecaoForm titulo="Quando e onde">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Período retratado" placeholder="Ex.: décadas de 1950 a 1980" error={erros.periodo} {...texto('periodo')} />
          <Input label="Local dentro do Memorial" placeholder="Ex.: Sala 2" error={erros.localizacao} {...texto('localizacao')} />
          <Input label="Abertura" type="date" error={erros.dataInicio} {...texto('dataInicio')} />
          <Input label="Encerramento" type="date" hint="Em branco para exposição permanente." error={erros.dataFim} {...texto('dataFim')} />
        </div>
      </SecaoForm>

      <SecaoForm titulo="No site" ajuda="Exposições em destaque aparecem primeiro na página do Memorial.">
        <label className="flex min-h-[44px] items-center gap-3 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={valores.destaque}
            onChange={(e) => definir('destaque', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Destacar esta exposição
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Ordem"
            type="number"
            min={0}
            value={valores.ordem}
            onChange={(e) => definir('ordem', Number(e.target.value) || 0)}
            error={erros.ordem}
          />
          <Input label="Endereço (slug)" hint="Gerado pelo título se ficar em branco." error={erros.slug} {...texto('slug')} />
        </div>
      </SecaoForm>

      <SecaoForm titulo="Relações" ajuda="O que faz parte desta exposição. Só aparece no site o que estiver publicado.">
        <SeletorVinculos legenda="Fotos e itens do acervo" opcoes={opcoes.itens} selecionados={valores.itemIds} onChange={(v) => definir('itemIds', v)} />
        <SeletorVinculos legenda="Pessoas" opcoes={opcoes.pessoas} selecionados={valores.pessoaIds} onChange={(v) => definir('pessoaIds', v)} />
        <SeletorVinculos legenda="Eventos" opcoes={opcoes.eventos} selecionados={valores.eventoIds} onChange={(v) => definir('eventoIds', v)} />
      </SecaoForm>

      <RecadoEnvio recado={recado} />
      <Button type="submit" loading={enviando} className="min-h-[44px]">
        {exposicao ? 'Salvar alterações' : 'Criar exposição'}
      </Button>
    </form>
  )
}
