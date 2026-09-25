import Link from 'next/link'
import { Button } from '@/components/ui'
import { sairModoEspelho } from './espelho/actions'

/**
 * Aviso fixo no topo enquanto o SUPER_ADMIN acompanha a área como outro
 * avaliador. Existe para nunca haver dúvida de que aquela não é a própria
 * sessão e de que nada do que aparece pode ser gravado.
 */
export function FaixaEspelho({ nome }: { nome: string }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-sm text-amber-950 lg:px-6"
    >
      <p>
        <strong className="font-semibold">Modo espelho.</strong> Você está vendo a área como{' '}
        <strong className="font-semibold">{nome}</strong>. Somente leitura: nada aqui é gravado.
      </p>
      <div className="flex items-center gap-2">
        <Link
          href="/avaliador/espelho"
          className="inline-flex min-h-[44px] items-center rounded-lg px-3 font-medium text-amber-950 underline underline-offset-2 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
        >
          Trocar avaliador
        </Link>
        <form action={sairModoEspelho}>
          <Button type="submit" variant="outline" size="sm" className="min-h-[44px]">
            Sair do modo espelho
          </Button>
        </form>
      </div>
    </div>
  )
}
