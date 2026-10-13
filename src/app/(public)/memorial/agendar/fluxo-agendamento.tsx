'use client'

import { useEffect, useRef, useState } from 'react'
import type { CampoFormulario } from '@/types/campo-formulario'
import type { SituacaoHorario } from '@/lib/memorial/agendamento/regras'
import { DADOS_VAZIOS, montarPedido, type DadosVisita } from './dados-visita'
import { IndicadorEtapas, type Etapa } from './indicador-etapas'
import { EtapaRegras } from './etapa-regras'
import { EtapaHorario } from './etapa-horario'
import { EtapaGrupo } from './etapa-grupo'
import { EtapaPerguntas } from './etapa-perguntas'
import { EtapaAceite } from './etapa-aceite'
import { ProtocoloVisita, type DestinoFinal, type PedidoRegistrado } from './protocolo-visita'
import { AjudaVisita } from './ajuda-visita'
import type { CacheAgenda } from './use-disponibilidade'

export interface RegrasPublicas {
  antecedenciaHoras: number
  maxPessoasPorGrupo: number
  maxGruposPorDia: number
  umTurnoPorDia: boolean
  textoRegistroFotografico: string
  mercadoArteUrl: string
}

interface FluxoAgendamentoProps {
  regras: RegrasPublicas
  regulamento: { versao: number; texto: string }
  perguntas: { titulo: string; descricao: string | null; campos: CampoFormulario[] } | null
  iniciais?: DadosVisita
  contatoEmail: string
  /** Para onde o comprovante leva ao terminar; o padrão é o site público do Memorial. */
  destinoFinal?: DestinoFinal
  /** Agenda do mês corrente já consultada no servidor, para a etapa de horário abrir sem espera. */
  agendaInicial?: { mes: string; dias: { data: string; horarios: SituacaoHorario[] }[] }
}

/**
 * Conduz o pedido em etapas curtas, uma por tela, pensando primeiro no celular.
 * A etapa de perguntas extras só aparece quando a equipe publicou um questionário
 * para o agendamento.
 */
export function FluxoAgendamento({
  regras,
  regulamento,
  perguntas,
  iniciais = DADOS_VAZIOS,
  contatoEmail,
  destinoFinal,
  agendaInicial,
}: FluxoAgendamentoProps) {
  const etapas: Etapa[] = ['regras', 'horario', 'grupo', ...(perguntas ? (['perguntas'] as const) : []), 'aceite']
  const [indice, setIndice] = useState(0)
  const [dados, setDados] = useState<DadosVisita>(iniciais)
  const [extras, setExtras] = useState<Record<string, unknown>>({})
  const [registrado, setRegistrado] = useState<PedidoRegistrado | null>(null)
  const [avisoHorario, setAvisoHorario] = useState('')
  const cache = useRef<CacheAgenda>(
    new Map(agendaInicial ? [[agendaInicial.mes, new Map(agendaInicial.dias.map((d) => [d.data, d.horarios]))]] : []),
  )
  const topo = useRef<HTMLDivElement>(null)
  const primeiraRenderizacao = useRef(true)

  // A cada troca de etapa o foco volta para o topo, para quem usa leitor de tela
  // saber que a tela mudou e para o celular não ficar parado no meio da página.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    topo.current?.focus()
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    topo.current?.scrollIntoView({ block: 'start', behavior: reduzir ? 'auto' : 'smooth' })
  }, [indice, registrado])

  const avancar = () => {
    setAvisoHorario('')
    setIndice((i) => Math.min(i + 1, etapas.length - 1))
  }
  const voltar = () => setIndice((i) => Math.max(i - 1, 0))
  const atualizar = (parcial: Partial<DadosVisita>) => setDados((d) => ({ ...d, ...parcial }))
  const etapa = etapas[indice]

  async function enviar(): Promise<string | null> {
    const res = await fetch('/api/v1/memorial/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(montarPedido(dados, regulamento.versao, perguntas ? extras : undefined)),
    }).catch(() => null)
    if (!res) return 'Sem conexão com o portal. Confira a internet e tente de novo.'
    const corpo = await res.json().catch(() => ({}))
    if (!res.ok) {
      // Horário tomado por outro grupo enquanto a pessoa preenchia: volta para escolher outro,
      // com a agenda consultada de novo (o cache é descartado) e o aviso no topo da etapa.
      if (res.status === 409 && /hor[aá]rio/i.test(corpo.message ?? '')) {
        cache.current.clear()
        atualizar({ turno: '', horaInicio: '', horaFim: '' })
        setAvisoHorario(corpo.message)
        setIndice(etapas.indexOf('horario'))
        return null
      }
      return corpo.message ?? 'Não foi possível registrar o pedido. Tente de novo.'
    }
    setRegistrado(corpo.data)
    return null
  }

  return (
    <div ref={topo} tabIndex={-1} className="scroll-mt-24 focus:outline-none">
      {registrado ? (
        <ProtocoloVisita pedido={registrado} contatoEmail={contatoEmail} destino={destinoFinal} />
      ) : (
        <>
          <IndicadorEtapas etapas={etapas} atual={indice} />
          <div className="mt-6 border-2 border-tinta-900 bg-white p-5 sm:p-8">
            {etapa === 'regras' && <EtapaRegras regras={regras} regulamento={regulamento.texto} aoContinuar={avancar} />}
            {etapa === 'horario' && (
              <EtapaHorario
                dados={dados}
                regras={regras}
                cache={cache.current}
                aviso={avisoHorario}
                aoEscolher={atualizar}
                aoVoltar={voltar}
                aoContinuar={avancar}
              />
            )}
            {etapa === 'grupo' && (
              <EtapaGrupo
                dados={dados}
                maxPessoas={regras.maxPessoasPorGrupo}
                aoMudar={atualizar}
                aoVoltar={voltar}
                aoContinuar={avancar}
              />
            )}
            {etapa === 'perguntas' && perguntas && (
              <EtapaPerguntas
                perguntas={perguntas}
                valores={extras}
                aoVoltar={voltar}
                aoContinuar={(v) => {
                  setExtras(v)
                  avancar()
                }}
              />
            )}
            {etapa === 'aceite' && (
              <EtapaAceite dados={dados} regras={regras} regulamento={regulamento.texto} aoVoltar={voltar} aoEnviar={enviar} />
            )}
          </div>
          <AjudaVisita contatoEmail={contatoEmail} className="mt-6" />
        </>
      )}
    </div>
  )
}
