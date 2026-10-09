'use client'

import type { FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { RecadoEnvio } from '../../_componentes/recado-envio'
import { SecaoForm } from '../../_componentes/secao-form'
import { SeletorVinculos } from '../../_componentes/seletor-vinculos'
import { useCampos, useSalvar } from '../../_componentes/use-envio'

export interface EventoEditavel {
  id: string
  titulo: string
  slug: string
  descricao: string | null
  periodo: string | null
  ano: number | null
  fontes: string | null
  itens: { id: string }[]
  pessoas: { id: string }[]
  exposicoes: { id: string }[]
}

export function EventoForm({ evento, opcoes }: { evento?: EventoEditavel; opcoes: OpcoesDeVinculo }) {
  const { enviando, erros, recado, salvar } = useSalvar(
    '/api/v1/memorial/eventos',
    evento?.id,
    '/admin/memorial/pessoas/eventos',
  )
  const { valores, definir, texto } = useCampos({
    titulo: evento?.titulo ?? '',
    slug: evento?.slug ?? '',
    descricao: evento?.descricao ?? '',
    periodo: evento?.periodo ?? '',
    ano: evento?.ano ? String(evento.ano) : '',
    fontes: evento?.fontes ?? '',
    itemIds: evento?.itens.map((i) => i.id) ?? [],
    pessoaIds: evento?.pessoas.map((p) => p.id) ?? [],
    exposicaoIds: evento?.exposicoes.map((e) => e.id) ?? [],
  })

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar({ ...valores, ano: valores.ano ? Number(valores.ano) : null })
  }

  return (
    <form onSubmit={enviar} className="max-w-3xl space-y-5" noValidate>
      <SecaoForm titulo="O acontecimento">
        <Input label="Título" required placeholder="Ex.: Primeiro desfile de carroças" error={erros.titulo} {...texto('titulo')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Ano"
            type="number"
            inputMode="numeric"
            min={1500}
            max={2100}
            hint="Posiciona o evento na linha do tempo."
            error={erros.ano}
            {...texto('ano')}
          />
          <Input label="Período, como se fala" placeholder="Ex.: início dos anos 1960" error={erros.periodo} {...texto('periodo')} />
        </div>
        <Textarea label="Descrição" rows={8} error={erros.descricao} {...texto('descricao')} />
        <Textarea label="Fontes" rows={3} error={erros.fontes} {...texto('fontes')} />
        <Input label="Endereço (slug)" hint="Gerado pelo título se ficar em branco." error={erros.slug} {...texto('slug')} />
      </SecaoForm>

      <SecaoForm titulo="Relações">
        <SeletorVinculos legenda="Pessoas" opcoes={opcoes.pessoas} selecionados={valores.pessoaIds} onChange={(v) => definir('pessoaIds', v)} />
        <SeletorVinculos legenda="Fotos e itens do acervo" opcoes={opcoes.itens} selecionados={valores.itemIds} onChange={(v) => definir('itemIds', v)} />
        <SeletorVinculos legenda="Exposições" opcoes={opcoes.exposicoes} selecionados={valores.exposicaoIds} onChange={(v) => definir('exposicaoIds', v)} />
      </SecaoForm>

      <RecadoEnvio recado={recado} />
      <Button type="submit" loading={enviando} className="min-h-[44px]">
        {evento ? 'Salvar alterações' : 'Cadastrar evento'}
      </Button>
    </form>
  )
}
