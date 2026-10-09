'use client'

import { IconCheckSimple } from '@/components/ui'
import type { Visitacao } from '@/lib/memorial/config'
import { CampoMarcar, CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { juntarAntecedencia, separarAntecedencia } from './regras-visita'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface Props {
  valores: Visitacao
  erros: Record<string, string>
  definir: <K extends keyof Visitacao>(campo: K, valor: Visitacao[K]) => void
}

const inteiro = (texto: string) => Number(texto) || 0

/** Quando e quantos: antecedência, tamanho do grupo, limite por dia e dias abertos. */
export function RegrasGrupo({ valores, erros, definir }: Props) {
  const antecedencia = separarAntecedencia(valores.antecedenciaHoras)

  function alternarDia(d: number) {
    const dias = valores.diasSemana.includes(d) ? valores.diasSemana.filter((x) => x !== d) : [...valores.diasSemana, d]
    definir('diasSemana', dias.sort())
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-tinta-900">Antecedência mínima do pedido</legend>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <CampoTexto rotulo="Dias" type="number" min={0} inputMode="numeric" value={antecedencia.dias}
            onChange={(e) => definir('antecedenciaHoras', juntarAntecedencia(inteiro(e.target.value), antecedencia.horas))} />
          <CampoTexto rotulo="Horas" type="number" min={0} max={23} inputMode="numeric" value={antecedencia.horas}
            onChange={(e) => definir('antecedenciaHoras', juntarAntecedencia(antecedencia.dias, inteiro(e.target.value)))} />
        </div>
        {erros.antecedenciaHoras && <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">{erros.antecedenciaHoras}</p>}
      </fieldset>

      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <CampoTexto rotulo="Pessoas por grupo" dica="No máximo" type="number" min={1} inputMode="numeric" erro={erros.maxPessoasPorGrupo}
          value={valores.maxPessoasPorGrupo} onChange={(e) => definir('maxPessoasPorGrupo', inteiro(e.target.value))} />
        <CampoTexto rotulo="Grupos por dia" dica="No máximo" type="number" min={1} inputMode="numeric" erro={erros.maxGruposPorDia}
          value={valores.maxGruposPorDia} onChange={(e) => definir('maxGruposPorDia', inteiro(e.target.value))} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-tinta-900">Dias da semana com visita</legend>
        <div className="flex flex-wrap gap-2">
          {DIAS.map((nome, d) => (
            <label
              key={nome}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-tinta-700 ring-1 ring-inset ring-tinta-900/15 hover:bg-papel-100 has-[:checked]:bg-oliva-700 has-[:checked]:text-white has-[:checked]:ring-oliva-700 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-500"
            >
              <input type="checkbox" className="sr-only" checked={valores.diasSemana.includes(d)} onChange={() => alternarDia(d)} />
              {valores.diasSemana.includes(d) && <IconCheckSimple className="h-4 w-4" />}
              {nome}
            </label>
          ))}
        </div>
        {erros.diasSemana && <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">Marque pelo menos um dia.</p>}
      </fieldset>

      <CampoMarcar
        rotulo="Um turno por dia"
        dica="Com uma visita confirmada de manhã, a tarde daquele dia fica fechada, e o contrário também."
        checked={valores.umTurnoPorDia}
        onChange={(e) => definir('umTurnoPorDia', e.target.checked)}
      />
    </div>
  )
}
