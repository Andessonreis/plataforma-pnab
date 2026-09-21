'use client'

import { useState } from 'react'
import type { EditalStatus } from '@prisma/client'
import { ETAPAS_RECURSO_ROTULO, etapaComExtrato, type EtapaRecurso } from '@/lib/edital/etapas-recurso'
import { BotaoBaixarPdf } from './botao-baixar-pdf'

interface RelatorioRecursosButtonsProps {
  editalId: string
  status: EditalStatus
}

const ETAPAS = Object.entries(ETAPAS_RECURSO_ROTULO) as [EtapaRecurso, string][]

/**
 * Um botão por etapa, exibido só quando o edital já chegou à fase em que o
 * prazo dela pode ter terminado. A mensagem da API (ex.: prazo em curso)
 * aparece logo abaixo.
 */
export function RelatorioRecursosButtons({ editalId, status }: RelatorioRecursosButtonsProps) {
  const [erro, setErro] = useState<string | null>(null)

  return (
    <>
      {ETAPAS.filter(([etapa]) => etapaComExtrato(etapa, status)).map(([etapa, rotulo]) => (
        <BotaoBaixarPdf
          key={etapa}
          url={`/api/admin/editais/${editalId}/relatorio-recursos?etapa=${etapa}`}
          nomePadrao={`relatorio-recursos-${etapa}.pdf`}
          rotulo={`Extrato de recursos — ${rotulo}`}
          ariaLabel={`Baixar extrato de recursos da etapa de ${rotulo.toLowerCase()} em PDF`}
          onErro={setErro}
        />
      ))}
      {erro && (
        <p role="alert" className="basis-full text-sm text-red-700">
          {erro}
        </p>
      )}
    </>
  )
}
