import Image from 'next/image'
import { IconDownload } from '@/components/ui/icons'
import type { ManualPublico } from './consulta'

interface CartaoImagemProps {
  manual: ManualPublico
}

/**
 * Logo ou peça visual com pré-visualização. A imagem entra sem otimização de
 * propósito: o otimizador recomprime e logo de marca não pode perder nitidez.
 * O fundo claro com moldura serve a logos de qualquer cor.
 */
export function CartaoImagem({ manual }: CartaoImagemProps) {
  return (
    <a
      href={manual.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col border-2 border-tinta-900 bg-white transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_theme(colors.tinta.900)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
    >
      <span className="relative block aspect-[4/3] border-b-2 border-tinta-900 bg-papel-50">
        <Image
          src={manual.url}
          alt={`Pré-visualização: ${manual.titulo}`}
          fill
          unoptimized
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-4"
        />
      </span>

      <span className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0">
          <span className="block text-sm font-bold leading-snug text-tinta-900 group-hover:text-brand-700">
            {manual.titulo}
          </span>
          <span className="mt-1 block text-xs font-bold uppercase tracking-[0.14em] text-tinta-600">
            {manual.extensao}
            {manual.versao && <> · versão {manual.versao}</>}
            <span className="sr-only"> (abre em nova aba)</span>
          </span>
        </span>
        <IconDownload className="h-5 w-5 shrink-0 text-tinta-600 group-hover:text-brand-700" />
      </span>
    </a>
  )
}
