import type { EntidadeMemorial } from '@/lib/services/memorial-conteudo.service'
import { BotaoExcluir } from '../_componentes/botao-excluir'
import { HistoricoVersoes } from '../_componentes/historico-versoes'

interface Props {
  entidade: EntidadeMemorial
  entidadeId: string
  endpoint: string
  nome: string
  destinoExclusao: string
}

/**
 * Histórico e exclusão ficam recolhidos no pé da página: usados de vez em quando,
 * não devem disputar atenção com a foto e o formulário.
 */
export function AcervoMaisOpcoes({ entidade, entidadeId, endpoint, nome, destinoExclusao }: Props) {
  return (
    <details className="mt-8 rounded-xl border border-tinta-900/10 bg-white">
      <summary className="flex min-h-[52px] cursor-pointer items-center px-4 text-sm font-semibold text-tinta-800 hover:text-brand-700">
        Histórico de versões e exclusão
      </summary>
      <div className="space-y-4 border-t border-tinta-900/10 p-4">
        <HistoricoVersoes entidade={entidade} entidadeId={entidadeId} />
        <div>
          <p className="mb-2 text-sm text-tinta-700">Excluir apaga o registro de vez. Para só tirar do site, use “Tirar do site” ou “Arquivar”.</p>
          <BotaoExcluir endpoint={endpoint} nome={nome} destino={destinoExclusao} />
        </div>
      </div>
    </details>
  )
}
