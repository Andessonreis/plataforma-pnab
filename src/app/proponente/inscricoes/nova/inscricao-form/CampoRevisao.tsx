import { formatCurrencyBRL } from '@client/components/ui'
import type { CampoFormulario } from '@shared/types/campo-formulario'
import { CampoEstruturaRevisao } from '../campo-estrutura'

export function CampoRevisao({
  campo,
  value: valor,
}: {
  campo: CampoFormulario
  value: unknown
}) {
  // Elementos estruturais têm render próprio
  if (campo.tipo === 'info' || campo.tipo === 'tabela' || campo.tipo === 'grupo_repetivel') {
    return (
      <CampoEstruturaRevisao
        campo={campo}
        value={valor}
      />
    )
  }

  const isEmpty = valor === undefined || valor === null || valor === '' ||
    (Array.isArray(valor) && valor.length === 0)
  return (
    <div className="border-b border-slate-100 pb-3">
      <dt className="text-sm text-slate-500">
        {campo.label}
        {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
      </dt>
      <dd className={`text-sm mt-0.5 ${isEmpty ? 'text-red-500 italic' : 'text-slate-900'}`}>
        {isEmpty
          ? 'Não preenchido'
          : (() => {
            if (Array.isArray(valor)) return (valor as string[]).join(', ')
            const isCurrency =
              campo.tipo === 'moeda' ||
              campo.tipo === 'currency' ||
              (/valor|preco|preço|custo|orcamento|orçamento/i.test(campo.nome) &&
                (campo.tipo === 'numero' || campo.tipo === 'number'))
            return isCurrency ? formatCurrencyBRL(valor as string) : String(valor)
          })()
        }
      </dd>
    </div>
  )
}
