import Link from 'next/link'
import { Badge, IconArrowRight } from '@/components/ui'

interface OpenEditalSummary {
  titulo: string
  slug: string
}

interface OpenEditaisBannerProps {
  count: number
  editais: OpenEditalSummary[]
}

// Ponteiro discreto pros editais abertos — uma linha de texto com um Badge
// pro estado, nunca uma caixa colorida solta. O painel dominante já cobre a
// urgência principal da tela; isto é só navegação complementar.
export function OpenEditaisBanner({ count, editais }: OpenEditaisBannerProps) {
  if (count === 0) return null

  // Com um único edital aberto, leva direto pra ele; com mais de um, pra listagem.
  const href = count === 1 && editais[0] ? `/editais/${editais[0].slug}` : '/editais'
  const mensagem = count === 1 && editais[0] ? editais[0].titulo : `${count} editais aceitando propostas`

  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-2.5 rounded-md py-1 text-sm text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <Badge variant="success" dot>
        Inscrições abertas
      </Badge>
      <span className="min-w-0 truncate">{mensagem}</span>
      <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-600 opacity-0 -translate-x-1 transition duration-150 ease-out group-hover:opacity-100 group-hover:translate-x-0" />
    </Link>
  )
}
