'use client'

import { Aviso } from '@/components/ui'
import { ACOES_COM_MOTIVO, ROTULO_ACAO, type AcaoVisita } from '@/lib/memorial/agendamento/status'
import { botaoNeutro, botaoPerigo, botaoPrimario, botaoSucesso } from '@/app/admin/memorial/_ui'
import { CampoMotivo } from '../_componentes/campo-motivo'
import { useDecisaoVisita } from '../_componentes/use-decisao-visita'

const ESTILO: Partial<Record<AcaoVisita, string>> = {
  CONFIRMAR: botaoPrimario,
  REALIZADA: botaoSucesso,
  RECUSAR: botaoPerigo,
  CANCELAR: botaoPerigo,
}

/** O que cada ação provoca, dito antes do clique. */
const EFEITO: Partial<Record<AcaoVisita, string>> = {
  CONFIRMAR: 'O responsável recebe a confirmação por e-mail.',
  ANALISAR: 'Avisa a equipe que alguém já está cuidando do pedido. O visitante não é avisado.',
  REALIZADA: 'Entra no relatório como visita atendida.',
}

interface Props {
  id: string
  acoes: AcaoVisita[]
  /** Ações que, no celular, ficam na barra presa ao pé da tela e por isso somem daqui. */
  naBarra?: AcaoVisita[]
}

/** Painel de decisão do detalhe: todas as ações possíveis, com o efeito de cada uma. */
export function AcoesVisita({ id, acoes, naBarra = [] }: Props) {
  const d = useDecisaoVisita(id)

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {acoes.map((acao) => (
          <li key={acao} className={naBarra.includes(acao) ? 'hidden lg:block' : ''}>
            <button
              type="button"
              onClick={() => d.executar(acao)}
              disabled={d.emCurso !== null}
              className={`${ESTILO[acao] ?? botaoNeutro} w-full`}
            >
              {d.emCurso === acao ? 'Salvando...' : d.pendente === acao ? `${ROTULO_ACAO[acao]}: enviar` : ROTULO_ACAO[acao]}
            </button>
            {EFEITO[acao] && <p className="mt-1 text-xs text-tinta-600">{EFEITO[acao]}</p>}
          </li>
        ))}
      </ul>

      {d.pendente && ACOES_COM_MOTIVO.includes(d.pendente) && (
        <CampoMotivo id="motivo-decisao" acao={d.pendente} valor={d.motivo} onChange={d.setMotivo} onDesistir={d.desistir} />
      )}
      {d.erro && <Aviso tom="erro">{d.erro}</Aviso>}
    </div>
  )
}
