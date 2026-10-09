'use client'

import { FormularioDinamico } from '@/components/formulario-dinamico'
import type { CampoFormulario } from '@/types/campo-formulario'

interface EtapaPerguntasProps {
  perguntas: { titulo: string; descricao: string | null; campos: CampoFormulario[] }
  valores: Record<string, unknown>
  aoVoltar: () => void
  aoContinuar: (valores: Record<string, unknown>) => void
}

/**
 * Perguntas que a equipe acrescentou ao pedido pelo painel de questionários. As respostas
 * só são gravadas junto com a visita, no envio final.
 */
export function EtapaPerguntas({ perguntas, valores, aoVoltar, aoContinuar }: EtapaPerguntasProps) {
  return (
    <div>
      <h2 className="titulo text-2xl text-tinta-900 sm:text-3xl">{perguntas.titulo}</h2>
      {perguntas.descricao && <p className="mt-2 text-sm leading-relaxed text-tinta-700">{perguntas.descricao}</p>}

      <FormularioDinamico
        className="mt-6"
        campos={perguntas.campos}
        valoresIniciais={valores}
        rotuloEnviar="Continuar"
        onSubmit={async (dados) => aoContinuar(dados)}
      />
      <button
        type="button"
        onClick={aoVoltar}
        className="mt-3 min-h-[48px] w-full border-2 border-tinta-900/30 px-5 text-sm font-semibold text-tinta-800 hover:border-tinta-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700 sm:w-auto"
      >
        Voltar
      </button>
    </div>
  )
}
