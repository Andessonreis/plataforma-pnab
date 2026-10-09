import { botaoPrimario } from '@/app/admin/memorial/_ui'
import { IconDownload } from '@/components/ui'

/** Baixa o PDF do período que está na tela; a rota repete as mesmas contas do relatório. */
export function BotaoBaixarPdf({ de, ate }: { de: string; ate: string }) {
  return (
    <a href={`/api/v1/memorial/agendamentos/relatorio/pdf?de=${de}&ate=${ate}`} download className={botaoPrimario}>
      <IconDownload className="h-4 w-4" />
      Baixar PDF
    </a>
  )
}
