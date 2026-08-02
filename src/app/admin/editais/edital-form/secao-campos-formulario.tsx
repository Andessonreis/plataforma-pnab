'use client'

import { Button } from '@/components/ui'
import { useEditalForm } from './edital-form-context'
import { CampoFormularioItem } from './campo-formulario-item'

export function SecaoCamposFormulario() {
  const { camposFormulario, addCampoFormulario } = useEditalForm()

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <p className="text-sm text-slate-500">
          Configure os campos que o proponente deverá preencher ao se inscrever.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addCampoFormulario}>
          + Adicionar campo
        </Button>
      </div>

      {camposFormulario.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum campo configurado. O formulário de inscrição ficará vazio.
        </p>
      ) : (
        <div className="space-y-4">
          {camposFormulario.map((campo, idx) => (
            <CampoFormularioItem key={idx} campo={campo} index={idx} />
          ))}
        </div>
      )}
    </div>
  )
}
