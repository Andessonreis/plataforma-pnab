'use client'

import { useState } from 'react'
import { BotaoBaixarPdf } from './botao-baixar-pdf'

interface ProjetosContempladosButtonsProps {
  editalId: string
}

/**
 * Dois botões para o mesmo lote de contemplados: só os dados dos projetos, ou
 * os dados seguidos dos anexos (o segundo é bem mais pesado — baixa cada
 * arquivo do storage). A mensagem da API aparece logo abaixo.
 */
export function ProjetosContempladosButtons({ editalId }: ProjetosContempladosButtonsProps) {
  const [erro, setErro] = useState<string | null>(null)
  const url = `/api/admin/editais/${editalId}/projetos-contemplados`

  return (
    <>
      <BotaoBaixarPdf
        url={url}
        nomePadrao="projetos-contemplados.pdf"
        rotulo="Projetos dos contemplados"
        ariaLabel="Baixar em PDF o projeto completo de todos os contemplados, sem anexos"
        onErro={setErro}
      />
      <BotaoBaixarPdf
        url={`${url}?anexos=1`}
        nomePadrao="dossies-contemplados.pdf"
        rotulo="Projetos dos contemplados (com anexos)"
        ariaLabel="Baixar em PDF o projeto completo de todos os contemplados, com fotos e anexos"
        onErro={setErro}
      />
      {erro && (
        <p role="alert" className="basis-full text-sm text-red-700">
          {erro}
        </p>
      )}
    </>
  )
}
