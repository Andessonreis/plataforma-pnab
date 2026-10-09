'use client'

import type { FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { CampoImagem } from '../_componentes/campo-imagem'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { SecaoForm } from '../_componentes/secao-form'
import { SeletorVinculos } from '../_componentes/seletor-vinculos'
import { useCampos, useSalvar } from '../_componentes/use-envio'

export interface PessoaEditavel {
  id: string
  nome: string
  slug: string
  biografia: string | null
  fotoUrl: string | null
  periodo: string | null
  fontes: string | null
  itens: { id: string }[]
  eventos: { id: string }[]
  exposicoes: { id: string }[]
}

export function PessoaForm({ pessoa, opcoes }: { pessoa?: PessoaEditavel; opcoes: OpcoesDeVinculo }) {
  const { enviando, erros, recado, salvar } = useSalvar('/api/v1/memorial/pessoas', pessoa?.id, '/admin/memorial/pessoas')
  const { valores, definir, texto } = useCampos({
    nome: pessoa?.nome ?? '',
    slug: pessoa?.slug ?? '',
    biografia: pessoa?.biografia ?? '',
    fotoUrl: pessoa?.fotoUrl ?? null,
    periodo: pessoa?.periodo ?? '',
    fontes: pessoa?.fontes ?? '',
    itemIds: pessoa?.itens.map((i) => i.id) ?? [],
    eventoIds: pessoa?.eventos.map((e) => e.id) ?? [],
    exposicaoIds: pessoa?.exposicoes.map((e) => e.id) ?? [],
  })

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <form onSubmit={enviar} className="max-w-3xl space-y-5" noValidate>
      <SecaoForm titulo="Quem é">
        <Input label="Nome" required placeholder="Ex.: Sanfoneiro Zé Bigode" error={erros.nome} {...texto('nome')} />
        <Input label="Período" placeholder="Ex.: 1930–2005" error={erros.periodo} {...texto('periodo')} />
        <Textarea
          label="Biografia"
          rows={10}
          hint="Escreva só o que a equipe confirmou. Aceita **negrito**, *itálico* e listas."
          error={erros.biografia}
          {...texto('biografia')}
        />
        <CampoImagem label="Retrato" pasta="pessoas" value={valores.fotoUrl} onChange={(u) => definir('fotoUrl', u)} />
        <Textarea label="Fontes" rows={3} hint="De onde vêm as informações: entrevistas, documentos, publicações." error={erros.fontes} {...texto('fontes')} />
        <Input label="Endereço (slug)" hint="Gerado pelo nome se ficar em branco." error={erros.slug} {...texto('slug')} />
      </SecaoForm>

      <SecaoForm titulo="Relações" ajuda="Onde esta pessoa aparece na memória do Memorial.">
        <SeletorVinculos legenda="Eventos" opcoes={opcoes.eventos} selecionados={valores.eventoIds} onChange={(v) => definir('eventoIds', v)} />
        <SeletorVinculos legenda="Fotos e itens do acervo" opcoes={opcoes.itens} selecionados={valores.itemIds} onChange={(v) => definir('itemIds', v)} />
        <SeletorVinculos legenda="Exposições" opcoes={opcoes.exposicoes} selecionados={valores.exposicaoIds} onChange={(v) => definir('exposicaoIds', v)} />
      </SecaoForm>

      <RecadoEnvio recado={recado} />
      <Button type="submit" loading={enviando} className="min-h-[44px]">
        {pessoa ? 'Salvar alterações' : 'Cadastrar pessoa'}
      </Button>
    </form>
  )
}
