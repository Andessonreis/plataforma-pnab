'use client'

/**
 * Escolha das colunas e download do recorte atual.
 *
 * Os filtros vêm da URL da página, então o arquivo sai exatamente com o que a
 * tela está mostrando — só muda quais colunas entram e em que formato.
 */
import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { CAMPOS_AGENTE, CAMPOS_PADRAO, labelDoCampo, type CampoAgente } from '@/lib/agentes/campos'

interface Props {
  /** Query string dos filtros aplicados, sem paginação. */
  queryFiltros: string
  total: number
}

export function ExportarAgentes({ queryFiltros, total }: Props) {
  const [campos, setCampos] = useState<CampoAgente[]>(CAMPOS_PADRAO)

  function alternar(campo: CampoAgente) {
    setCampos((atual) =>
      atual.includes(campo) ? atual.filter((c) => c !== campo) : [...atual, campo],
    )
  }

  /** Preserva a ordem do catálogo, não a ordem dos cliques. */
  const camposOrdenados = CAMPOS_AGENTE.filter((campo) => campos.includes(campo))

  function urlDe(formato: 'csv' | 'pdf') {
    const params = new URLSearchParams(queryFiltros)
    params.set('campos', camposOrdenados.join(','))
    params.set('formato', formato)
    return `/api/admin/agentes/export?${params.toString()}`
  }

  const semCampo = camposOrdenados.length === 0

  return (
    <Card padding="sm" className="mb-4 sm:mb-6 sm:p-6">
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 mb-2">Colunas da exportação</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
          {CAMPOS_AGENTE.map((campo) => (
            <label key={campo} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={campos.includes(campo)}
                onChange={() => alternar(campo)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {labelDoCampo(campo)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button href={semCampo ? undefined : urlDe('csv')} disabled={semCampo}>
          Exportar CSV
        </Button>
        <Button href={semCampo ? undefined : urlDe('pdf')} variant="secondary" disabled={semCampo}>
          Exportar PDF
        </Button>
        <p className="text-xs text-slate-500">
          {semCampo
            ? 'Marque ao menos uma coluna.'
            : `${total} cadastro(s) no recorte atual. A exportação fica registrada nos logs.`}
        </p>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        O CSV traz o CPF/CNPJ completo, para conferência de cadastro; no PDF ele sai
        parcialmente oculto. Os dois contêm dados pessoais protegidos pela LGPD.
      </p>
    </Card>
  )
}
