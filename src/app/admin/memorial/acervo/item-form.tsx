'use client'

import type { FormEvent } from 'react'
import type { MemorialTipoAcervo } from '@prisma/client'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { ROTULO_TIPO_ACERVO, TIPOS_ACERVO } from '@/lib/memorial/rotulos'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { CampoImagem } from '../_componentes/campo-imagem'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { SecaoForm } from '../_componentes/secao-form'
import { SeletorVinculos } from '../_componentes/seletor-vinculos'
import { useCampos, useSalvar } from '../_componentes/use-envio'
import { ItemCreditos } from './item-creditos'
import { corpoDoItem, valoresIniciais, type ItemEditavel } from './item-valores'

export function ItemForm({ item, opcoes }: { item?: ItemEditavel; opcoes: OpcoesDeVinculo }) {
  const { enviando, erros, recado, salvar } = useSalvar('/api/v1/memorial/acervo', item?.id, '/admin/memorial/acervo')
  const campos = useCampos(valoresIniciais(item))
  const { valores, definir, texto } = campos
  const foto = valores.tipo === 'FOTOGRAFIA'

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(corpoDoItem(valores))
  }

  return (
    <form onSubmit={enviar} className="max-w-3xl space-y-5" noValidate>
      <SecaoForm titulo="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tipo"
            value={valores.tipo}
            onChange={(e) => definir('tipo', e.target.value as MemorialTipoAcervo)}
            options={TIPOS_ACERVO.map((t) => ({ value: t, label: ROTULO_TIPO_ACERVO[t] }))}
          />
          <Input label="Título" required error={erros.titulo} {...texto('titulo')} />
          <Input label="Década" type="number" step={10} placeholder="Ex.: 1950" error={erros.decada} {...texto('decada')} />
          <Input label="Data aproximada" placeholder="Ex.: junho de 1962" error={erros.dataAproximada} {...texto('dataAproximada')} />
          <Input label="Local" placeholder="Ex.: Praça da Matriz" error={erros.local} {...texto('local')} />
          <Input label="Etiquetas" hint="Separadas por vírgula." placeholder="são joão, carroças" error={erros.tags} {...texto('tags')} />
        </div>
        <Input
          label="Legenda"
          hint={foto ? 'Também é o texto alternativo da foto para quem usa leitor de tela.' : undefined}
          error={erros.legenda}
          {...texto('legenda')}
        />
      </SecaoForm>

      <SecaoForm
        titulo={foto ? 'Imagens' : 'Imagem ou digitalização'}
        ajuda={foto ? 'A foto atual, do mesmo lugar hoje, ativa a comparação antes e hoje no site.' : undefined}
      >
        <CampoImagem label={foto ? 'Fotografia histórica' : 'Imagem'} pasta="acervo" value={valores.arquivoUrl} onChange={(u) => definir('arquivoUrl', u)} />
        {foto && (
          <CampoImagem label="Foto atual (hoje)" pasta="acervo" value={valores.fotoAtualUrl} onChange={(u) => definir('fotoAtualUrl', u)} />
        )}
      </SecaoForm>

      <SecaoForm titulo="Contexto" ajuda="Só fatos confirmados pela equipe. Pessoa que ninguém identificou fica como “não identificada”.">
        <Textarea label="Descrição" rows={5} error={erros.descricao} {...texto('descricao')} />
        <Textarea
          label="Contexto histórico"
          rows={5}
          hint="O que mudou e o que permanece no lugar ou no costume retratado."
          error={erros.contextoHistorico}
          {...texto('contextoHistorico')}
        />
      </SecaoForm>

      <ItemCreditos {...campos} erros={erros} />

      <SecaoForm titulo="Organização">
        <Select
          label="Álbum"
          value={valores.albumId}
          onChange={(e) => definir('albumId', e.target.value)}
          options={[{ value: '', label: 'Sem álbum' }, ...opcoes.albuns.map((a) => ({ value: a.id, label: a.rotulo }))]}
        />
        <SeletorVinculos legenda="Exposições" opcoes={opcoes.exposicoes} selecionados={valores.exposicaoIds} onChange={(v) => definir('exposicaoIds', v)} />
        <SeletorVinculos legenda="Pessoas" opcoes={opcoes.pessoas} selecionados={valores.pessoaIds} onChange={(v) => definir('pessoaIds', v)} />
        <SeletorVinculos legenda="Eventos" opcoes={opcoes.eventos} selecionados={valores.eventoIds} onChange={(v) => definir('eventoIds', v)} />
      </SecaoForm>

      <RecadoEnvio recado={recado} />
      <Button type="submit" loading={enviando} className="min-h-[44px]">
        {item ? 'Salvar alterações' : 'Cadastrar item'}
      </Button>
    </form>
  )
}
