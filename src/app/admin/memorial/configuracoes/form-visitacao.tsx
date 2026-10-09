'use client'

import type { FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { FaixaVisite } from '@/components/memorial/faixa-visite'
import type { Contato, Visitacao } from '@/lib/memorial/config'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { SecaoForm } from '../_componentes/secao-form'
import { useCampos, useSalvar } from '../_componentes/use-envio'
import { HorariosTurno } from './horarios-turno'
import { CONFIGURACOES, PreviaSite } from './previa-site'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function FormVisitacao({ inicial, contato }: { inicial: Visitacao; contato: Contato }) {
  const { valores, definir, texto } = useCampos(inicial)
  const { enviando, erros, recado, salvar } = useSalvar(CONFIGURACOES, 'visitacao', '')

  function numero(campo: 'antecedenciaHoras' | 'maxPessoasPorGrupo' | 'maxGruposPorDia') {
    return { value: valores[campo], onChange: (e: { target: { value: string } }) => definir(campo, Number(e.target.value) || 0) }
  }

  function alternarDia(d: number) {
    const dias = valores.diasSemana.includes(d) ? valores.diasSemana.filter((x) => x !== d) : [...valores.diasSemana, d]
    definir('diasSemana', dias.sort())
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <SecaoForm titulo="Visitação" ajuda="Regras usadas pelo agendamento de visitas e mostradas ao público.">
      <form onSubmit={enviar} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Antecedência mínima (horas)" type="number" min={0} error={erros.antecedenciaHoras} {...numero('antecedenciaHoras')} />
          <Input label="Pessoas por grupo (máximo)" type="number" min={1} error={erros.maxPessoasPorGrupo} {...numero('maxPessoasPorGrupo')} />
          <Input label="Grupos por dia (máximo)" type="number" min={1} error={erros.maxGruposPorDia} {...numero('maxGruposPorDia')} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Dias com visita</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIAS.map((nome, d) => (
              <label key={nome} className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm has-[:checked]:border-slate-800 has-[:checked]:bg-slate-800 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500">
                <input type="checkbox" className="sr-only" checked={valores.diasSemana.includes(d)} onChange={() => alternarDia(d)} />
                {nome}
              </label>
            ))}
          </div>
          {erros.diasSemana && <p className="mt-1 text-sm text-red-700">Marque ao menos um dia.</p>}
        </fieldset>

        <label className="flex min-h-[44px] items-center gap-3 text-sm text-slate-800">
          <input type="checkbox" checked={valores.umTurnoPorDia} onChange={(e) => definir('umTurnoPorDia', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Um turno por dia: com visita confirmada de manhã, a tarde fica indisponível (e vice-versa)
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <HorariosTurno turno="Manhã" horarios={valores.horarios.MANHA} onChange={(h) => definir('horarios', { ...valores.horarios, MANHA: h })} erro={erros['horarios.MANHA']} />
          <HorariosTurno turno="Tarde" horarios={valores.horarios.TARDE} onChange={(h) => definir('horarios', { ...valores.horarios, TARDE: h })} erro={erros['horarios.TARDE']} />
        </div>

        <Input label="Link do agendamento do Mercado de Arte" hint="Em branco esconde o botão no site." error={erros.mercadoArteUrl} {...texto('mercadoArteUrl')} />
        <Textarea label="Aviso sobre registro fotográfico" rows={3} error={erros.textoRegistroFotografico} {...texto('textoRegistroFotografico')} />
        <Textarea
          label="Mensagem de solicitação recebida"
          rows={3}
          hint="Aparece para quem acabou de pedir uma visita."
          error={erros.textoSolicitacaoRecebida}
          {...texto('textoSolicitacaoRecebida')}
        />

        <RecadoEnvio recado={recado} />
        <Button type="submit" loading={enviando} className="min-h-[44px]">
          Salvar regras de visitação
        </Button>
      </form>
      <PreviaSite>
        <FaixaVisite visitacao={valores} contato={contato} />
      </PreviaSite>
    </SecaoForm>
  )
}
