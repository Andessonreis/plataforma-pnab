'use client'

import { useState } from 'react'
import { IconEye } from '@/components/ui'
import { FormularioDinamico } from '@/components/formulario-dinamico'
import type { CampoFormulario } from '@/types/campo-formulario'

interface Props {
  titulo: string
  descricao: string
  campos: CampoFormulario[]
}

/**
 * O formulário como o público vê, com as cores do site e a validação de verdade.
 * Dá para preencher e testar o envio; nada do que for enviado aqui é salvo.
 */
export function PreVisualizacao({ titulo, descricao, campos }: Props) {
  const [testou, setTestou] = useState(false)

  return (
    <figure className="overflow-hidden rounded-xl border border-tinta-900/15 bg-white">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-tinta-900/10 bg-papel-100 px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-semibold text-tinta-800">
          <IconEye className="h-4 w-4" />
          Como o público vê
        </span>
        <span className="text-tinta-700">Pode testar: nada é salvo</span>
      </figcaption>
      <div className="tema-secult font-questrial papel-textura bg-papel-50 p-4 sm:p-6">
        <h3 className="titulo text-2xl leading-tight tracking-wide text-tinta-900">{titulo || 'Título do questionário'}</h3>
        {descricao && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tinta-700">{descricao}</p>}
        <div className="mt-5 border-2 border-tinta-900/15 bg-white p-4 sm:p-5">
          {campos.length === 0 ? (
            <p className="text-sm text-tinta-600">As perguntas aparecem aqui assim que você adicionar a primeira.</p>
          ) : (
            <FormularioDinamico
              key={JSON.stringify(campos)}
              campos={campos}
              rotuloEnviar="Testar envio"
              onSubmit={async () => setTestou(true)}
              rodape={testou ? <p role="status" className="text-sm font-medium text-oliva-800">Tudo certo. No site, este envio geraria um protocolo.</p> : null}
            />
          )}
        </div>
      </div>
    </figure>
  )
}
