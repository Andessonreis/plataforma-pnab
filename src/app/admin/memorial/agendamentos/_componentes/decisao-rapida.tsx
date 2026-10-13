'use client'

import { Aviso } from '@/components/ui'
import { botaoNeutro, botaoPerigo, botaoPrimario } from '@/app/admin/memorial/_ui'
import { CampoMotivo } from './campo-motivo'
import { useDecisaoVisita } from './use-decisao-visita'

interface Props {
  id: string
  /** Texto para leitor de tela saber de qual pedido são os botões. */
  rotulo: string
  /** `barra` fica presa ao pé da tela do celular, no detalhe do pedido. */
  variante?: 'cartao' | 'barra'
}

/** Confirmar ou recusar sem sair da tela. A recusa abre o motivo antes de enviar. */
export function DecisaoRapida({ id, rotulo, variante = 'cartao' }: Props) {
  const d = useDecisaoVisita(id)
  const recusando = d.pendente === 'RECUSAR'
  const ocupado = d.emCurso !== null

  const conteudo = (
    <div role="group" aria-label={`Responder: ${rotulo}`} className="space-y-3">
      {recusando && (
        <CampoMotivo id={`motivo-${variante}-${id}`} acao="RECUSAR" valor={d.motivo} onChange={d.setMotivo} onDesistir={d.desistir} />
      )}
      <div className="flex gap-2">
        {!recusando && (
          <button type="button" onClick={() => d.executar('CONFIRMAR')} disabled={ocupado} className={`${botaoPrimario} flex-1 sm:flex-none`}>
            {d.emCurso === 'CONFIRMAR' ? 'Confirmando...' : 'Confirmar'}
          </button>
        )}
        <button
          type="button"
          onClick={() => d.executar('RECUSAR')}
          disabled={ocupado}
          className={`${recusando ? botaoPerigo : botaoNeutro} flex-1 sm:flex-none`}
        >
          {recusando ? (d.emCurso === 'RECUSAR' ? 'Enviando...' : 'Enviar recusa') : 'Recusar'}
        </button>
      </div>
      {d.erro && <Aviso tom="erro">{d.erro}</Aviso>}
    </div>
  )

  if (variante === 'cartao') return conteudo
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-tinta-900/15 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgb(41_23_11/0.08)] lg:hidden">
      {conteudo}
    </div>
  )
}
