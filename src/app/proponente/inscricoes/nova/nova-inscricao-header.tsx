import Link from 'next/link'
import { IconArrowLeft } from '@/components/ui/icons'

// Cabeçalho da página de nova inscrição — link de retorno, título e edital de referência.
// O botão de tutorial mora no InscricaoForm (mais abaixo), não aqui: só lá dá
// pra saber em que etapa o proponente está e explicar o que tem na tela de verdade.
export function NovaInscricaoHeader({ editalTitulo }: { editalTitulo: string }) {
  return (
    <div>
      <Link
        href="/proponente/inscricoes"
        className="inline-flex items-center gap-1.5 rounded text-sm text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 mb-4"
      >
        <IconArrowLeft className="h-4 w-4" />
        Voltar para inscrições
      </Link>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">Nova Inscrição</h1>
      <p className="text-sm text-slate-500 mt-1">
        Edital: <span className="font-medium text-brand-700">{editalTitulo}</span>
      </p>
    </div>
  )
}
