'use client'

import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { BlocoSecao, linkDiscreto } from '../../_ui'
import { CampoArea, CampoTexto } from '../../_ui/acervo-campo'
import { AcervoEscolhaVinculos } from '../../_ui/acervo-escolha-vinculos'
import { AcervoTrocaImagem } from '../../_ui/acervo-troca-imagem'
import type { SecaoExposicaoProps } from './exposicao-valores'

/** Título, chamada, capa e o texto que o visitante lê. */
export function SecaoApresentacao({ valores, definir, texto, erros }: SecaoExposicaoProps) {
  return (
    <BlocoSecao titulo="Apresentação">
      <div className="space-y-4">
        <CampoTexto rotulo="Título" required erro={erros.titulo} {...texto('titulo')} />
        <CampoTexto rotulo="Chamada" dica="Uma frase que convida a entrar. Aparece embaixo do título." erro={erros.subtitulo} {...texto('subtitulo')} />
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tinta-600">Imagem de capa</p>
          <div className="flex flex-wrap items-center gap-3">
            <AcervoTrocaImagem pasta="exposicoes" rotulo={valores.capaUrl ? 'Trocar capa' : 'Enviar capa'} onEnviada={(url) => definir('capaUrl', url)} />
            {valores.capaUrl && (
              <button type="button" className={`${linkDiscreto} min-h-[44px]`} onClick={() => definir('capaUrl', null)}>
                Tirar capa
              </button>
            )}
          </div>
        </div>
        <CampoArea
          rotulo="Texto da exposição"
          dica="Aceita **negrito**, *itálico*, listas e subtítulos começando com ##."
          rows={10}
          erro={erros.descricao}
          {...texto('descricao')}
        />
      </div>
    </BlocoSecao>
  )
}

/** Período retratado, sala e datas de abertura e encerramento. */
export function SecaoQuandoOnde({ texto, erros }: SecaoExposicaoProps) {
  return (
    <BlocoSecao titulo="Quando e onde">
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto rotulo="Período retratado" placeholder="Ex.: décadas de 1950 a 1980" erro={erros.periodo} {...texto('periodo')} />
        <CampoTexto rotulo="Local dentro do Memorial" placeholder="Ex.: Sala 2" erro={erros.localizacao} {...texto('localizacao')} />
        <CampoTexto rotulo="Abertura" type="date" erro={erros.dataInicio} {...texto('dataInicio')} />
        <CampoTexto rotulo="Encerramento" type="date" dica="Em branco para exposição permanente." erro={erros.dataFim} {...texto('dataFim')} />
      </div>
    </BlocoSecao>
  )
}

/** Pessoas e eventos ligados, destaque na página e endereço no site. */
export function SecaoNoSite({ valores, definir, texto, erros, opcoes }: SecaoExposicaoProps & { opcoes: OpcoesDeVinculo }) {
  return (
    <BlocoSecao titulo="Pessoas, eventos e destaque">
      <div className="space-y-5">
        <AcervoEscolhaVinculos
          rotulo="Pessoas"
          opcoes={opcoes.pessoas}
          selecionados={valores.pessoaIds}
          onChange={(v) => definir('pessoaIds', v)}
          vazio="Nenhuma pessoa cadastrada ainda."
        />
        <AcervoEscolhaVinculos
          rotulo="Eventos"
          opcoes={opcoes.eventos}
          selecionados={valores.eventoIds}
          onChange={(v) => definir('eventoIds', v)}
          vazio="Nenhum evento cadastrado ainda."
        />
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm font-semibold text-tinta-900">
          <input
            type="checkbox"
            checked={valores.destaque}
            onChange={(e) => definir('destaque', e.target.checked)}
            className="h-5 w-5 rounded border-tinta-900/30 accent-brand-600"
          />
          Mostrar entre as primeiras na página do Memorial
        </label>
        <details>
          <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-semibold text-tinta-700 hover:text-brand-700">
            Ordem e endereço no site
          </summary>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <CampoTexto
              rotulo="Ordem"
              dica="Menor vem antes."
              type="number"
              min={0}
              value={valores.ordem}
              onChange={(e) => definir('ordem', Number(e.target.value) || 0)}
              erro={erros.ordem}
            />
            <CampoTexto rotulo="Final do endereço" dica="Em branco, é criado a partir do título." erro={erros.slug} {...texto('slug')} />
          </div>
        </details>
      </div>
    </BlocoSecao>
  )
}
