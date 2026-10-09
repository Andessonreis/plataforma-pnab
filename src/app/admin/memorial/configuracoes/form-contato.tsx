'use client'

import type { FormEvent } from 'react'
import { Button, Input } from '@/components/ui'
import { BlocoContato } from '@/components/memorial/bloco-contato'
import type { Contato } from '@/lib/memorial/config'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { SecaoForm } from '../_componentes/secao-form'
import { useCampos, useSalvar } from '../_componentes/use-envio'
import { CONFIGURACOES, PreviaSite } from './previa-site'

export function FormContato({ inicial }: { inicial: Contato }) {
  const { valores, texto } = useCampos(inicial)
  const { enviando, erros, recado, salvar } = useSalvar(CONFIGURACOES, 'contato', '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <SecaoForm titulo="Contato" ajuda="Só aparece no site o que estiver preenchido.">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="E-mail" type="email" error={erros.email} {...texto('email')} />
          <Input label="Telefone" type="tel" error={erros.telefone} {...texto('telefone')} />
          <Input label="WhatsApp" type="tel" hint="Com DDD, só números ou com espaços." error={erros.whatsapp} {...texto('whatsapp')} />
          <Input label="Instagram" placeholder="@memorialirece" error={erros.instagram} {...texto('instagram')} />
          <Input label="Site" error={erros.site} {...texto('site')} />
          <Input label="Endereço" error={erros.endereco} {...texto('endereco')} />
        </div>
        <Input
          label="Horário de funcionamento"
          placeholder="Ex.: segunda a sexta, das 9h às 12h e das 14h às 17h"
          error={erros.funcionamento}
          {...texto('funcionamento')}
        />
        <RecadoEnvio recado={recado} />
        <Button type="submit" loading={enviando} className="min-h-[44px]">
          Salvar contato
        </Button>
      </form>
      <PreviaSite>
        <BlocoContato contato={valores} />
      </PreviaSite>
    </SecaoForm>
  )
}
