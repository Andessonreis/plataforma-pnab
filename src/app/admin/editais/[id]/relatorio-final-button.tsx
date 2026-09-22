'use client'

import { BotaoBaixarPdf } from './botao-baixar-pdf'

interface RelatorioFinalButtonProps {
  editalId: string
}

export function RelatorioFinalButton({ editalId }: RelatorioFinalButtonProps) {
  return (
    <BotaoBaixarPdf
      url={`/api/admin/editais/${editalId}/relatorio-final`}
      nomePadrao="relatorio-final.pdf"
      rotulo="Relatório Final"
      ariaLabel="Baixar Relatório Final em PDF"
      onErro={(mensagem) => {
        if (mensagem) alert('Erro ao gerar o relatório final. Tente novamente.')
      }}
    />
  )
}
