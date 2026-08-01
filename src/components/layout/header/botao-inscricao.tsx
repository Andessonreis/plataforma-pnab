import Link from 'next/link'
import { IconArrowRight } from '@/components/ui/icons'

interface BotaoInscricaoProps {
  href: string
  /** Barra de largura total: no celular não há espaço ao lado da marca. */
  faixa?: boolean
}

/**
 * Ação principal do portal, com o rótulo nomeando o que acontece ao clicar.
 *
 * "Área do proponente" era o nome interno do processo. Quem faz cultura em
 * Irecê não se chama de proponente antes de ler o primeiro edital, então o
 * rótulo dizia à pessoa o nome que ela ainda não tem. Agora nomeia a ação, e
 * troca para "Minha área" depois que ela entra — aí o destino deixa de ser um
 * convite e passa a ser um lugar que já é dela.
 *
 * O destaque vem de âmbar com sombra dura deslocada, o mesmo bloco impresso
 * do resto do portal: em terracota o botão tinha a cor ambiente do cabeçalho
 * e se dissolvia no papel do masthead em vez de saltar dele.
 */
export function BotaoInscricao({ href, faixa = false }: BotaoInscricaoProps) {
  const rotulo = href === '/login' ? 'Inscrever meu projeto' : 'Minha área'

  const base =
    'group inline-flex min-h-[48px] items-center justify-center gap-2 bg-accent-500 text-xs font-bold uppercase tracking-[0.14em] text-tinta-950 transition-all hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta-900'

  if (faixa) {
    return (
      <Link href={href} className={`${base} w-full border-t-2 border-tinta-900/15 px-4 lg:hidden`}>
        {rotulo}
        <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`${base} hidden rounded-sm px-5 shadow-[3px_3px_0_0_theme(colors.tinta.900)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_theme(colors.tinta.900)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none lg:inline-flex`}
    >
      {rotulo}
      <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}
