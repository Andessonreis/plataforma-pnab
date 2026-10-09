'use client'

import type { FormEvent } from 'react'
import { Button, Input, Textarea } from '@/components/ui'
import { CapaMemorial } from '@/components/memorial/capa-memorial'
import type { Institucional } from '@/lib/memorial/config'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { SecaoForm } from '../_componentes/secao-form'
import { useCampos, useSalvar } from '../_componentes/use-envio'
import { CONFIGURACOES, PreviaSite } from './previa-site'

export function FormInstitucional({ inicial, foto }: { inicial: Institucional; foto: string | null }) {
  const { valores, texto } = useCampos(inicial)
  const { enviando, erros, recado, salvar } = useSalvar(CONFIGURACOES, 'institucional', '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <SecaoForm titulo="Apresentação do Memorial" ajuda="Nome, frase de abertura e texto institucional da página do Memorial.">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Input label="Nome" required error={erros.titulo} {...texto('titulo')} />
        <Input label="Chamada" hint="Frase curta sob o nome, na abertura da página." error={erros.chamada} {...texto('chamada')} />
        <Textarea
          label="Texto institucional"
          rows={8}
          hint="O primeiro parágrafo aparece na página inicial; o texto inteiro, em “Sobre”. Separe parágrafos com uma linha em branco."
          error={erros.texto}
          {...texto('texto')}
        />
        <RecadoEnvio recado={recado} />
        <Button type="submit" loading={enviando} className="min-h-[44px]">
          Salvar apresentação
        </Button>
      </form>
      <PreviaSite>
        <CapaMemorial institucional={valores} foto={foto} credito={null} previa />
      </PreviaSite>
    </SecaoForm>
  )
}
