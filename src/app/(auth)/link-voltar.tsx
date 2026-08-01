import Link from 'next/link'
import { IconArrowLeft } from '@/components/ui/icons'

interface LinkVoltarProps {
  href: string
  children: string
}

/**
 * Caminho de volta no pé de uma ficha de acesso.
 *
 * Estava copiado quatro vezes entre entrar, recuperar e redefinir senha, cada
 * cópia carregando o mesmo SVG de seta por inteiro no meio do formulário — e a
 * seta já existia no conjunto de ícones do projeto.
 */
export function LinkVoltar({ href, children }: LinkVoltarProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-800"
    >
      <IconArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  )
}
