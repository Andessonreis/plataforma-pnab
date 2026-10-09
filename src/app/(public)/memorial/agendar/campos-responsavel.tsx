'use client'

import { Input, Textarea } from '@/components/ui'
import { idDoCampo } from '@/components/formulario-dinamico/campo-com-erro'
import { PREFERENCIAS_CONTATO, ROTULO_PREFERENCIA } from '@/lib/memorial/agendamento/status'
import type { CamposProps } from './campos-grupo'
import { OpcoesRadio } from './opcoes-radio'

const PREFERENCIAS = PREFERENCIAS_CONTATO.map((p) => ({ valor: p, rotulo: ROTULO_PREFERENCIA[p] }))

/** Responsável pelo grupo, como prefere ser avisado e o que a equipe precisa saber antes. */
export function CamposResponsavel({ dados, erros, aoMudar }: CamposProps) {
  return (
    <>
      <fieldset className="mt-8 space-y-5 border-t-2 border-tinta-900/10 pt-6">
        <legend className="mb-1 text-base font-semibold text-tinta-900">Responsável</legend>

        <Input
          id={idDoCampo('responsavelNome')}
          label="Nome completo"
          value={dados.responsavelNome}
          onChange={(e) => aoMudar({ responsavelNome: e.target.value })}
          error={erros.responsavelNome}
          required
          autoComplete="name"
        />
        <Input
          id={idDoCampo('responsavelCargo')}
          label="Cargo ou função"
          placeholder="Ex.: professora, coordenador, guia"
          value={dados.responsavelCargo}
          onChange={(e) => aoMudar({ responsavelCargo: e.target.value })}
          error={erros.responsavelCargo}
          autoComplete="organization-title"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id={idDoCampo('responsavelEmail')}
            label="E-mail"
            type="email"
            value={dados.responsavelEmail}
            onChange={(e) => aoMudar({ responsavelEmail: e.target.value })}
            error={erros.responsavelEmail}
            required
            autoComplete="email"
          />
          <Input
            id={idDoCampo('responsavelTelefone')}
            label="Telefone ou WhatsApp"
            type="tel"
            inputMode="tel"
            placeholder="(74) 99999-0000"
            value={dados.responsavelTelefone}
            onChange={(e) => aoMudar({ responsavelTelefone: e.target.value })}
            error={erros.responsavelTelefone}
            required
            autoComplete="tel"
          />
        </div>
        <OpcoesRadio
          nome="preferenciaContato"
          legenda="Como prefere receber a resposta da equipe"
          opcoes={PREFERENCIAS}
          valor={dados.preferenciaContato}
          aoMudar={(preferenciaContato) => aoMudar({ preferenciaContato })}
          erro={erros.preferenciaContato}
          obrigatorio
        />
      </fieldset>

      <fieldset className="mt-8 space-y-5 border-t-2 border-tinta-900/10 pt-6">
        <legend className="mb-1 text-base font-semibold text-tinta-900">Sobre a visita</legend>
        <Textarea
          id={idDoCampo('necessidades')}
          label="Necessidades específicas"
          hint="Acessibilidade, mobilidade, intérprete de Libras ou outro cuidado que a equipe deve preparar."
          rows={3}
          value={dados.necessidades}
          onChange={(e) => aoMudar({ necessidades: e.target.value })}
          error={erros.necessidades}
        />
        <Textarea
          id={idDoCampo('observacoes')}
          label="Observações"
          rows={3}
          value={dados.observacoes}
          onChange={(e) => aoMudar({ observacoes: e.target.value })}
          error={erros.observacoes}
        />
      </fieldset>
    </>
  )
}
