'use client'

import type { FormEvent } from 'react'
import type { StatusConteudo } from '@prisma/client'
import { pendenciasItem } from '@/lib/memorial/publicacao'
import type { OpcoesDeVinculo } from '@/lib/services/memorial-painel.service'
import { AcervoBarraSalvar } from '../../_ui/acervo-barra-salvar'
import { AcervoPassos } from '../../_ui/acervo-passos'
import { useAcervoEdicao } from '../../_ui/acervo-use-edicao'
import { FotoItem } from './foto-item'
import { corpoDoItem, valoresIniciais, type ItemEditavel } from './item-valores'
import { SecaoCreditos, SecaoOndeAparece, SecaoQuemQuando, SecaoSobre } from './secoes-item'

interface Props {
  item?: ItemEditavel & { status: StatusConteudo }
  opcoes: OpcoesDeVinculo
}

/**
 * Edição de um item do acervo: situação no topo, a foto grande de um lado e os
 * campos do outro (no celular, a foto vem primeiro). O que falta para publicar é
 * recalculado a cada campo preenchido.
 */
export function ItemForm({ item, opcoes }: Props) {
  const edicao = useAcervoEdicao('/api/v1/memorial/acervo', item?.id, '/admin/memorial/acervo', valoresIniciais(item))
  const { valores, erros, enviando, recado, salvar, alteracoesPendentes } = edicao
  const secao = { valores, definir: edicao.definir, texto: edicao.texto, erros }

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(corpoDoItem(valores))
  }

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      {item && (
        <AcervoPassos
          endpoint={`/api/v1/memorial/acervo/${item.id}`}
          status={item.status}
          pendencias={pendenciasItem(valores)}
          alteracoesPendentes={alteracoesPendentes}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <FotoItem valores={valores} definir={edicao.definir} />
        <div className="space-y-5">
          <SecaoSobre {...secao} />
          <SecaoQuemQuando {...secao} opcoes={opcoes} />
          <SecaoCreditos {...secao} />
          <SecaoOndeAparece {...secao} opcoes={opcoes} />
        </div>
      </div>

      <AcervoBarraSalvar
        rotulo={item ? 'Salvar alterações' : 'Cadastrar item'}
        enviando={enviando}
        alteracoesPendentes={alteracoesPendentes}
        recado={recado}
      />
    </form>
  )
}
