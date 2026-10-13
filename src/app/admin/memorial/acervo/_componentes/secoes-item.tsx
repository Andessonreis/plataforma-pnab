'use client'

import type { MemorialTipoAcervo } from '@prisma/client'
import { ROTULO_TIPO_ACERVO, TIPOS_ACERVO } from '@/lib/memorial/rotulos'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { BlocoSecao } from '../../_ui'
import { CampoArea, CampoSelecao, CampoTexto } from '../../_ui/acervo-campo'
import { AcervoEscolhaVinculos } from '../../_ui/acervo-escolha-vinculos'
import { CampoAutorizacao } from './campo-autorizacao'
import type { SecaoItemProps } from './item-valores'

/** O que é, o que mostra e por que importa. */
export function SecaoSobre({ valores, definir, texto, erros }: SecaoItemProps) {
  const foto = valores.tipo === 'FOTOGRAFIA'
  return (
    <BlocoSecao titulo={foto ? 'Sobre a foto' : 'Sobre o item'}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CampoTexto rotulo="Título" required erro={erros.titulo} {...texto('titulo')} />
        <CampoSelecao
          rotulo="Tipo"
          value={valores.tipo}
          onChange={(e) => definir('tipo', e.target.value as MemorialTipoAcervo)}
          opcoes={TIPOS_ACERVO.map((t) => ({ valor: t, rotulo: ROTULO_TIPO_ACERVO[t] }))}
        />
      </div>
      <div className="mt-4 space-y-4">
        <CampoTexto
          rotulo="Legenda"
          dica={foto ? 'Uma frase sobre o que aparece. Também é lida em voz alta para quem não enxerga a foto.' : undefined}
          erro={erros.legenda}
          {...texto('legenda')}
        />
        <CampoArea rotulo="Descrição" rows={4} erro={erros.descricao} {...texto('descricao')} />
        <CampoArea
          rotulo="Contexto histórico"
          rows={4}
          dica="Só fatos confirmados: o que mudou e o que permanece no lugar ou no costume retratado."
          erro={erros.contextoHistorico}
          {...texto('contextoHistorico')}
        />
      </div>
    </BlocoSecao>
  )
}

/** Quando, onde e quem aparece: o que liga a foto à linha do tempo e às pessoas. */
export function SecaoQuemQuando({ valores, definir, texto, erros, opcoes }: SecaoItemProps & { opcoes: OpcoesDeVinculo }) {
  return (
    <BlocoSecao titulo="Quem e quando" dica="Pessoa que ninguém identificou fica de fora; não arrisque nomes.">
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto rotulo="Década" type="number" step={10} placeholder="Ex.: 1950" erro={erros.decada} {...texto('decada')} />
        <CampoTexto rotulo="Data aproximada" placeholder="Ex.: junho de 1962" erro={erros.dataAproximada} {...texto('dataAproximada')} />
        <CampoTexto rotulo="Local" placeholder="Ex.: Praça da Matriz" erro={erros.local} {...texto('local')} />
      </div>
      <div className="mt-5 space-y-5">
        <AcervoEscolhaVinculos
          rotulo="Pessoas"
          opcoes={opcoes.pessoas}
          selecionados={valores.pessoaIds}
          onChange={(v) => definir('pessoaIds', v)}
          vazio="Nenhuma pessoa cadastrada ainda. Cadastre em Pessoas e eventos."
        />
        <AcervoEscolhaVinculos
          rotulo="Eventos"
          opcoes={opcoes.eventos}
          selecionados={valores.eventoIds}
          onChange={(v) => definir('eventoIds', v)}
          vazio="Nenhum evento cadastrado ainda. Cadastre em Pessoas e eventos."
        />
      </div>
    </BlocoSecao>
  )
}

/** Autoria, origem e direitos: o que permite (ou não) mostrar o item ao público. */
export function SecaoCreditos({ valores, definir, texto, erros }: SecaoItemProps) {
  return (
    <BlocoSecao titulo="Créditos e direitos" dica="Toda imagem tem dono. Registre de onde veio e em que condições pode ser usada.">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          rotulo="Crédito"
          dica="Aparece junto da imagem no site."
          placeholder="Ex.: Acervo da família Dourado"
          erro={erros.credito}
          {...texto('credito')}
        />
        <CampoTexto rotulo="Fotógrafo" erro={erros.fotografo} {...texto('fotografo')} />
        <CampoTexto rotulo="Autor" erro={erros.autor} {...texto('autor')} />
        <CampoTexto rotulo="Fonte ou instituição de origem" erro={erros.fonte} {...texto('fonte')} />
      </div>
      <div className="mt-4 space-y-4">
        <CampoArea rotulo="Direitos de uso e observações" rows={2} erro={erros.direitosUso} {...texto('direitosUso')} />
        <CampoAutorizacao marcado={valores.autorizado} onChange={(v) => definir('autorizado', v)} />
      </div>
    </BlocoSecao>
  )
}

/** Onde o item aparece no site: álbum, exposições e etiquetas de busca. */
export function SecaoOndeAparece({ valores, definir, texto, erros, opcoes }: SecaoItemProps & { opcoes: OpcoesDeVinculo }) {
  return (
    <BlocoSecao titulo="Onde aparece no site">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoSelecao
          rotulo="Álbum"
          value={valores.albumId}
          onChange={(e) => definir('albumId', e.target.value)}
          opcoes={[{ valor: '', rotulo: 'Sem álbum' }, ...opcoes.albuns.map((a) => ({ valor: a.id, rotulo: a.rotulo }))]}
        />
        <CampoTexto rotulo="Etiquetas" dica="Separadas por vírgula. Ajudam a achar a foto na busca." placeholder="são joão, carroças" erro={erros.tags} {...texto('tags')} />
      </div>
      <div className="mt-5">
        <AcervoEscolhaVinculos
          rotulo="Exposições"
          opcoes={opcoes.exposicoes}
          selecionados={valores.exposicaoIds}
          onChange={(v) => definir('exposicaoIds', v)}
          vazio="Nenhuma exposição cadastrada ainda."
        />
      </div>
    </BlocoSecao>
  )
}
