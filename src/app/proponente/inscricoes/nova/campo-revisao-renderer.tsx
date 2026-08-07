'use client'

import { formatCurrencyBRL } from '@/components/ui'
import type { CampoFormulario } from '@/types/campo-formulario'
import { CampoEstruturaRevisao } from './campo-estrutura-revisao'

// Render de campo em modo leitura, usado na etapa de revisão da inscrição.
export function CampoRevisaoRenderer({ campo, value }: { campo: CampoFormulario; value: unknown }) {
  if (campo.tipo === 'info' || campo.tipo === 'tabela' || campo.tipo === 'grupo_repetivel') {
    return <CampoEstruturaRevisao campo={campo} value={value} />
  }

  const isEmpty = value === undefined || value === null || value === '' ||
    (Array.isArray(value) && value.length === 0)
  return (
    <div className="border-b border-slate-100 pb-3">
      <dt className="text-sm text-slate-500">
        {campo.label}
        {campo.obrigatorio && <span className="text-red-600 ml-1">*</span>}
      </dt>
      <dd className={`text-sm mt-0.5 ${isEmpty ? 'text-red-700 italic' : 'text-slate-900'}`}>
        {isEmpty
          ? 'Não preenchido'
          : (() => {
            if (Array.isArray(value)) return (value as string[]).join(', ')
            const isCurrency =
              campo.tipo === 'moeda' ||
              campo.tipo === 'currency' ||
              (/valor|preco|preço|custo|orcamento|orçamento/i.test(campo.nome) &&
                (campo.tipo === 'numero' || campo.tipo === 'number'))
            return isCurrency ? formatCurrencyBRL(value as string) : String(value)
          })()
        }
      </dd>
    </div>
  )
}
