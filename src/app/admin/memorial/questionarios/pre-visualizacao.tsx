'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import { FormularioDinamico } from '@/components/formulario-dinamico'
import type { CampoFormulario } from '@/types/campo-formulario'

/**
 * Mostra o formulário como o público vai ver, com a validação de verdade.
 * O envio aqui não grava nada.
 */
export function PreVisualizacao({ campos }: { campos: CampoFormulario[] }) {
  const [testou, setTestou] = useState(false)

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Como o público vê</h2>
      <p className="mb-5 text-xs text-slate-600 sm:text-sm">
        Preencha para conferir obrigatórios e limites. Nada do que for enviado aqui é salvo.
      </p>
      {campos.length === 0 ? (
        <p className="text-sm text-slate-600">Adicione perguntas para ver a prévia.</p>
      ) : (
        <FormularioDinamico
          key={JSON.stringify(campos)}
          campos={campos}
          rotuloEnviar="Testar envio"
          onSubmit={async () => setTestou(true)}
          rodape={testou ? <p role="status" className="text-sm text-emerald-800">Respostas válidas. No site, este envio geraria um protocolo.</p> : null}
        />
      )}
    </Card>
  )
}
