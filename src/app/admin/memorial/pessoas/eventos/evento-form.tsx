'use client'

import type { FormEvent } from 'react'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { useCampos, useSalvar } from '@/app/admin/memorial/_componentes/use-envio'
import { BlocoSecao } from '@/app/admin/memorial/_ui'
import { CampoArea, CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { RodapeSalvar } from '@/app/admin/memorial/_ui/config-barra-salvar'
import { Ligacoes } from '../_edicao/ligacoes'

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
  const { enviando, erros, recado, salvar } = useSalvar('/api/v1/memorial/eventos', evento?.id, '/admin/memorial/pessoas/eventos')
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
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <BlocoSecao titulo="O acontecimento">
        <div className="space-y-4">
          <CampoTexto rotulo="Título" required placeholder="Ex.: Primeiro desfile de carroças" erro={erros.titulo} {...texto('titulo')} />
          <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <CampoTexto
              rotulo="Ano"
              type="number"
              inputMode="numeric"
              min={1500}
              max={2100}
              placeholder="1962"
              dica="Define o lugar na linha do tempo."
              erro={erros.ano}
              {...texto('ano')}
            />
            <CampoTexto rotulo="Período, do jeito que se fala" placeholder="Ex.: início dos anos 1960" erro={erros.periodo} {...texto('periodo')} />
          </div>
          <CampoArea rotulo="O que aconteceu" rows={8} dica="Obrigatório para publicar." erro={erros.descricao} {...texto('descricao')} />
          <CampoArea rotulo="De onde vêm as informações" rows={3} erro={erros.fontes} {...texto('fontes')} />
        </div>
      </BlocoSecao>

      <Ligacoes
        titulo="Quem e o que faz parte"
        ligacoes={[
          { legenda: 'Pessoas', efeito: 'As pessoas aparecem no evento e o evento aparece na página delas.', opcoes: opcoes.pessoas, selecionados: valores.pessoaIds, onChange: (v) => definir('pessoaIds', v) },
          { legenda: 'Fotos e itens do acervo', efeito: 'A primeira foto ilustra o evento na linha do tempo.', opcoes: opcoes.itens, selecionados: valores.itemIds, onChange: (v) => definir('itemIds', v) },
          { legenda: 'Exposições', efeito: 'O evento é citado nas exposições marcadas.', opcoes: opcoes.exposicoes, selecionados: valores.exposicaoIds, onChange: (v) => definir('exposicaoIds', v) },
        ]}
      />

      <BlocoSecao titulo="Endereço da página no site">
        <CampoTexto rotulo="Final do endereço" dica="Em branco, é criado a partir do título." erro={erros.slug} {...texto('slug')} />
      </BlocoSecao>

      <RodapeSalvar valores={valores} recado={recado} enviando={enviando} rotulo={evento ? 'Salvar alterações' : 'Cadastrar evento'} />
    </form>
  )
}
