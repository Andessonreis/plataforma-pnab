'use client'

import { useId, type FormEvent } from 'react'
import type { Manual } from '@prisma/client'
import { ENDPOINT_MANUAIS } from '@/lib/manuais/regras'
import { useCampos, useSalvar } from '@/app/admin/memorial/_componentes/use-envio'
import { BlocoSecao } from '@/app/admin/memorial/_ui'
import { CampoMarcar, CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { RodapeSalvar } from '@/app/admin/memorial/_ui/config-barra-salvar'
import { CampoArquivo } from './campo-arquivo'

export type ManualEditavel = Pick<Manual, 'id' | 'titulo' | 'categoria' | 'versao' | 'publicado' | 'url'>

interface Props {
  manual?: ManualEditavel
  /** Categorias já cadastradas, sugeridas enquanto digita. */
  categorias: string[]
}

export function ManualForm({ manual, categorias }: Props) {
  const listaCategorias = useId()
  const { enviando, erros, recado, salvar } = useSalvar(ENDPOINT_MANUAIS, manual?.id, '/admin/manuais')
  const { valores, definir, texto } = useCampos({
    titulo: manual?.titulo ?? '',
    categoria: manual?.categoria ?? '',
    versao: manual?.versao ?? '',
    publicado: manual?.publicado ?? true,
    url: manual?.url ?? '',
  })

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <BlocoSecao titulo="Documento" dica="O título e a categoria aparecem na página pública de Manuais.">
        <div className="space-y-4">
          <CampoTexto rotulo="Título" required placeholder="Ex.: Guia de inscrição" erro={erros.titulo} {...texto('titulo')} />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <CampoTexto
              rotulo="Categoria"
              required
              list={listaCategorias}
              placeholder="Ex.: Prestação de contas"
              dica="Os documentos são agrupados por categoria no site."
              erro={erros.categoria}
              {...texto('categoria')}
            />
            <CampoTexto rotulo="Versão" placeholder="Ex.: 2.1" erro={erros.versao} {...texto('versao')} />
          </div>
          <datalist id={listaCategorias}>
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <CampoArquivo url={valores.url} onChange={(url) => definir('url', url)} erro={erros.url} />
        </div>
      </BlocoSecao>

      <BlocoSecao titulo="Visibilidade">
        <CampoMarcar
          rotulo="Publicado"
          dica="Desmarcado, o documento fica guardado aqui e some da página pública."
          checked={valores.publicado}
          onChange={(e) => definir('publicado', e.target.checked)}
        />
      </BlocoSecao>

      <RodapeSalvar valores={valores} recado={recado} enviando={enviando} rotulo={manual ? 'Salvar alterações' : 'Cadastrar documento'} />
    </form>
  )
}
