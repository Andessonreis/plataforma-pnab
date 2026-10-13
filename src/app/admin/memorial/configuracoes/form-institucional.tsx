'use client'

import type { FormEvent } from 'react'
import { CapaMemorial } from '@/components/memorial/capa-memorial'
import type { Institucional } from '@/lib/memorial/config'
import { useCampos, useSalvar } from '@/app/admin/memorial/_componentes/use-envio'
import { RodapeSalvar } from '@/app/admin/memorial/_ui/config-barra-salvar'
import { CampoArea, CampoTexto } from '@/app/admin/memorial/_ui/config-campo'
import { CONFIGURACOES, SecaoConfig } from './previa-site'

export function FormInstitucional({ inicial, foto }: { inicial: Institucional; foto: string | null }) {
  const { valores, texto } = useCampos(inicial)
  const { enviando, erros, recado, salvar } = useSalvar(CONFIGURACOES, 'institucional', '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    salvar(valores)
  }

  return (
    <SecaoConfig
      titulo="Apresentação do Memorial"
      explicacao="O que o visitante lê ao abrir a página do Memorial."
      onSubmit={enviar}
      previa={<CapaMemorial institucional={valores} foto={foto} credito={null} previa />}
    >
      <CampoTexto rotulo="Nome do Memorial" required erro={erros.titulo} {...texto('titulo')} />
      <CampoTexto rotulo="Chamada" dica="Frase curta logo abaixo do nome, na abertura da página." erro={erros.chamada} {...texto('chamada')} />
      <CampoArea
        rotulo="Texto de apresentação"
        rows={9}
        dica="O primeiro parágrafo aparece na abertura; o texto inteiro, na página “Sobre”. Deixe uma linha em branco entre parágrafos."
        erro={erros.texto}
        {...texto('texto')}
      />
      <RodapeSalvar valores={valores} recado={recado} enviando={enviando} rotulo="Salvar apresentação" sobreCartao />
    </SecaoConfig>
  )
}
