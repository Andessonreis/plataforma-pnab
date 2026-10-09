'use client'

import type { FormEvent } from 'react'
import { BlocoContato } from '@/components/memorial/bloco-contato'
import type { Contato } from '@/lib/memorial/config'
import { useCampos, useSalvar } from '@/app/admin/memorial/_componentes/use-envio'
import { RodapeSalvar } from '@/app/admin/memorial/_ui/config-barra-salvar'
import { CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { CONFIGURACOES, SecaoConfig } from './previa-site'

export function FormContato({ inicial }: { inicial: Contato }) {
  const { valores, texto } = useCampos(inicial)
  const { enviando, erros, recado, salvar } = useSalvar(CONFIGURACOES, 'contato', '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <SecaoConfig
      titulo="Como falar com o Memorial"
      explicacao="Só aparece no site o que estiver preenchido. Campo em branco some da página."
      onSubmit={enviar}
      previa={<BlocoContato contato={valores} />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto rotulo="E-mail" type="email" inputMode="email" erro={erros.email} {...texto('email')} />
        <CampoTexto rotulo="Telefone" type="tel" inputMode="tel" erro={erros.telefone} {...texto('telefone')} />
        <CampoTexto rotulo="WhatsApp" type="tel" inputMode="tel" placeholder="(74) 9 9999-9999" dica="Com DDD." erro={erros.whatsapp} {...texto('whatsapp')} />
        <CampoTexto rotulo="Instagram" placeholder="@memorialirece" erro={erros.instagram} {...texto('instagram')} />
      </div>
      <CampoTexto rotulo="Site" placeholder="https://" erro={erros.site} {...texto('site')} />
      <CampoTexto rotulo="Endereço" placeholder="Rua, número, bairro" erro={erros.endereco} {...texto('endereco')} />
      <CampoTexto
        rotulo="Dias e horários de funcionamento"
        placeholder="Ex.: segunda a sexta, das 9h às 12h e das 14h às 17h"
        erro={erros.funcionamento}
        {...texto('funcionamento')}
      />
      <RodapeSalvar valores={valores} recado={recado} enviando={enviando} rotulo="Salvar contato" sobreCartao />
    </SecaoConfig>
  )
}
