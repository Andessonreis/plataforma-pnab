import Link from 'next/link'
import { botaoTinta } from './estilos'

interface VazioPainelProps {
  titulo: string
  texto: string
  acao?: { href: string; rotulo: string }
}

/** Estado vazio das listas do painel: diz o que acontece ali e leva à próxima ação. */
export function VazioPainel({ titulo, texto, acao }: VazioPainelProps) {
  return (
    <div className="border-2 border-dashed border-tinta-900/30 p-5">
      <p className="font-semibold text-tinta-900">{titulo}</p>
      <p className="mt-1 max-w-prose text-sm text-tinta-700">{texto}</p>
      {acao && (
        <Link href={acao.href} className={`${botaoTinta} mt-4`}>
          {acao.rotulo}
        </Link>
      )}
    </div>
  )
}
