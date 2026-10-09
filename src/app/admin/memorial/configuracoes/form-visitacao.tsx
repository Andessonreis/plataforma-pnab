'use client'

import type { FormEvent, ReactNode } from 'react'
import { FaixaVisite } from '@/components/memorial/faixa-visite'
import type { Contato, Visitacao } from '@/lib/memorial/config'
import { useCampos, useSalvar } from '@/app/admin/memorial/_componentes/use-envio'
import { RodapeSalvar } from '@/app/admin/memorial/_ui/config-barra-salvar'
import { CampoArea, CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { HorariosTurno } from './horarios-turno'
import { CONFIGURACOES, SecaoConfig } from './previa-site'
import { RegrasGrupo } from './regras-grupo'

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-tinta-900/10 pt-5">
      <h3 className="text-base font-bold text-tinta-900">{titulo}</h3>
      {children}
    </section>
  )
}

export function FormVisitacao({ inicial, contato }: { inicial: Visitacao; contato: Contato }) {
  const { valores, definir, texto } = useCampos(inicial)
  const { enviando, erros, recado, salvar } = useSalvar(CONFIGURACOES, 'visitacao', '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <SecaoConfig
      titulo="Regras de visita"
      explicacao="Valem para o formulário de agendamento: o público só consegue pedir o que estas regras permitem."
      onSubmit={enviar}
      previaLarga
      previa={<FaixaVisite visitacao={valores} contato={contato} />}
    >
      <RegrasGrupo valores={valores} erros={erros} definir={definir} />

      <Bloco titulo="Horários que o público pode escolher">
        <div className="grid gap-4">
          <HorariosTurno turno="Manhã" inicioPadrao="09:00" horarios={valores.horarios.MANHA}
            onChange={(h) => definir('horarios', { ...valores.horarios, MANHA: h })} erro={erros['horarios.MANHA']} />
          <HorariosTurno turno="Tarde" inicioPadrao="14:00" horarios={valores.horarios.TARDE}
            onChange={(h) => definir('horarios', { ...valores.horarios, TARDE: h })} erro={erros['horarios.TARDE']} />
        </div>
      </Bloco>

      <Bloco titulo="Avisos e links">
        <CampoTexto rotulo="Link do agendamento do Mercado de Arte" placeholder="https://" dica="Em branco, o botão do Mercado de Arte some do site."
          erro={erros.mercadoArteUrl} {...texto('mercadoArteUrl')} />
        <CampoArea rotulo="Aviso sobre fotos durante a visita" rows={3} erro={erros.textoRegistroFotografico} {...texto('textoRegistroFotografico')} />
        <CampoArea rotulo="Mensagem para quem acabou de pedir visita" rows={3} dica="Aparece logo depois do envio do pedido."
          erro={erros.textoSolicitacaoRecebida} {...texto('textoSolicitacaoRecebida')} />
      </Bloco>

      <RodapeSalvar valores={valores} recado={recado} enviando={enviando} rotulo="Salvar regras de visita" sobreCartao />
    </SecaoConfig>
  )
}
