'use client'

import { CampoRenderer } from '@/app/proponente/inscricoes/nova/campo-renderer'
import type { CampoFormulario } from '@/types/campo-formulario'

export const idDoCampo = (nome: string) => `campo-${nome}`

interface CampoComErroProps {
  campo: CampoFormulario
  valor: unknown
  erro?: string
  onChange: (valor: unknown) => void
}

/**
 * O `CampoRenderer` da inscrição não recebe mensagem de erro, então ela vem
 * logo abaixo do campo, num invólucro que também serve de âncora para o resumo.
 */
export function CampoComErro({ campo, valor, erro, onChange }: CampoComErroProps) {
  return (
    <div
      id={idDoCampo(campo.nome)}
      className={erro ? 'scroll-mt-24 border-l-4 border-red-600 pl-3' : 'scroll-mt-24'}
    >
      <CampoRenderer campo={campo} value={valor} onChange={onChange} />
      {erro && (
        <p className="mt-1.5 text-sm font-medium text-red-700">{erro}</p>
      )}
    </div>
  )
}
