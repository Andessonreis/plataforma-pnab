'use client'

import type { FormEvent } from 'react'
import type { StatusConteudo } from '@prisma/client'
import { pendenciasExposicao } from '@/lib/memorial/publicacao'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { AcervoBarraSalvar } from '../../_ui/acervo-barra-salvar'
import type { Miniatura } from '../../_ui/acervo-miniaturas'
import { AcervoPassos } from '../../_ui/acervo-passos'
import { useAcervoEdicao } from '../../_ui/acervo-use-edicao'
import { valoresExposicao, type ExposicaoEditavel } from './exposicao-valores'
import { FotosExposicao } from './fotos-exposicao'
import { PreviaExposicao } from './previa-exposicao'
import { SecaoApresentacao, SecaoNoSite, SecaoQuandoOnde } from './secoes-exposicao'

interface Props {
  exposicao?: ExposicaoEditavel & { status: StatusConteudo }
  opcoes: OpcoesDeVinculo
  acervo: Miniatura[]
}

/**
 * Edição de uma exposição: situação no topo, a prévia do cartão como sai no site
 * (atualiza enquanto se digita), os campos e as fotos que compõem a exposição.
 */
export function ExposicaoForm({ exposicao, opcoes, acervo }: Props) {
  const edicao = useAcervoEdicao('/api/v1/memorial/exposicoes', exposicao?.id, '/admin/memorial/exposicoes', valoresExposicao(exposicao))
  const { valores, erros, enviando, recado, salvar, alteracoesPendentes } = edicao
  const secao = { valores, definir: edicao.definir, texto: edicao.texto, erros }

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      {exposicao && (
        <AcervoPassos
          endpoint={`/api/v1/memorial/exposicoes/${exposicao.id}`}
          status={exposicao.status}
          pendencias={pendenciasExposicao(valores)}
          alteracoesPendentes={alteracoesPendentes}
        />
      )}

      <PreviaExposicao valores={valores} />

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <SecaoApresentacao {...secao} />
        <div className="space-y-5">
          <SecaoQuandoOnde {...secao} />
          <SecaoNoSite {...secao} opcoes={opcoes} />
        </div>
      </div>

      <FotosExposicao acervo={acervo} selecionados={valores.itemIds} onChange={(v) => edicao.definir('itemIds', v)} />

      <AcervoBarraSalvar
        rotulo={exposicao ? 'Salvar alterações' : 'Criar exposição'}
        enviando={enviando}
        alteracoesPendentes={alteracoesPendentes}
        recado={recado}
      />
    </form>
  )
}
