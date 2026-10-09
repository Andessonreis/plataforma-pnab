'use client'

import type { FormEvent } from 'react'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { CampoImagem } from '@/app/admin/memorial/_componentes/campo-imagem'
import { useCampos, useSalvar } from '@/app/admin/memorial/_componentes/use-envio'
import { BlocoSecao } from '@/app/admin/memorial/_ui'
import { CampoArea, CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { RodapeSalvar } from '@/app/admin/memorial/_ui/config-barra-salvar'
import { Ligacoes } from './_edicao/ligacoes'

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
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <BlocoSecao titulo="Quem é">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="space-y-4">
            <CampoTexto rotulo="Nome" required placeholder="Ex.: Sanfoneiro Zé Bigode" erro={erros.nome} {...texto('nome')} />
            <CampoTexto rotulo="Período de vida ou de atuação" placeholder="Ex.: 1930–2005" erro={erros.periodo} {...texto('periodo')} />
          </div>
          <CampoImagem label="Retrato" pasta="pessoas" value={valores.fotoUrl} onChange={(u) => definir('fotoUrl', u)} />
        </div>
      </BlocoSecao>

      <BlocoSecao titulo="História" dica="Escreva só o que a equipe confirmou. A biografia é obrigatória para publicar.">
        <div className="space-y-4">
          <CampoArea
            rotulo="Biografia"
            rows={10}
            dica="Aceita **negrito**, *itálico* e listas com hífen."
            erro={erros.biografia}
            {...texto('biografia')}
          />
          <CampoArea rotulo="De onde vêm as informações" rows={3} dica="Entrevistas, documentos, livros, jornais." erro={erros.fontes} {...texto('fontes')} />
        </div>
      </BlocoSecao>

      <Ligacoes
        titulo="Onde esta pessoa aparece"
        ligacoes={[
          { legenda: 'Eventos', efeito: 'A pessoa aparece no evento e o evento aparece na página dela.', opcoes: opcoes.eventos, selecionados: valores.eventoIds, onChange: (v) => definir('eventoIds', v) },
          { legenda: 'Fotos e itens do acervo', efeito: 'As fotos entram na galeria da página da pessoa.', opcoes: opcoes.itens, selecionados: valores.itemIds, onChange: (v) => definir('itemIds', v) },
          { legenda: 'Exposições', efeito: 'A pessoa é citada nas exposições marcadas.', opcoes: opcoes.exposicoes, selecionados: valores.exposicaoIds, onChange: (v) => definir('exposicaoIds', v) },
        ]}
      />

      <BlocoSecao titulo="Endereço da página no site">
        <CampoTexto
          rotulo="Final do endereço"
          dica={`Fica em /memorial/pessoas/${valores.slug || '…'}. Em branco, é criado a partir do nome.`}
          erro={erros.slug}
          {...texto('slug')}
        />
      </BlocoSecao>

      <RodapeSalvar valores={valores} recado={recado} enviando={enviando} rotulo={pessoa ? 'Salvar alterações' : 'Cadastrar pessoa'} />
    </form>
  )
}
