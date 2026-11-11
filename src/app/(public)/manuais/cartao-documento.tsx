import { IconDownload } from '@/components/ui/icons'
import type { ManualPublico, TipoArquivo } from './consulta'

/** Cor do selo por tipo: bate o olho e já se sabe se é PDF, texto ou planilha. */
const SELO: Record<Exclude<TipoArquivo, 'imagem'>, string> = {
  pdf: 'bg-brand-700',
  documento: 'bg-turquesa-700',
  planilha: 'bg-oliva-700',
}

interface CartaoDocumentoProps {
  manual: ManualPublico
}

/**
 * Documento para baixar. O selo de cor à esquerda leva a extensão, e o cartão
 * inteiro é o link: o alvo de toque cobre a largura toda, não só o ícone.
 */
export function CartaoDocumento({ manual }: CartaoDocumentoProps) {
  const selo = SELO[manual.tipo as keyof typeof SELO] ?? SELO.documento

  return (
    <a
      href={manual.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[88px] items-stretch border-2 border-tinta-900 bg-white transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_theme(colors.tinta.900)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
    >
      <span
        className={`flex w-20 shrink-0 items-center justify-center ${selo} titulo text-lg tracking-wide text-papel-50`}
        aria-hidden="true"
      >
        {manual.extensao}
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
        <span className="text-sm font-bold leading-snug text-tinta-900 group-hover:text-brand-700">
          {manual.titulo}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-tinta-600">
          {manual.extensao}
          {manual.versao && <> · versão {manual.versao}</>}
          <span className="sr-only"> (abre em nova aba)</span>
        </span>
      </span>

      <span className="flex w-14 shrink-0 items-center justify-center border-l-2 border-tinta-900/15 text-tinta-600 group-hover:bg-papel-100 group-hover:text-brand-700">
        <IconDownload className="h-5 w-5" />
      </span>
    </a>
  )
}
