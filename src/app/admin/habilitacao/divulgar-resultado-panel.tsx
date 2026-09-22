'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, InlineFeedback } from '@/components/ui'
import type { ResumoDivulgacao } from '@/types/divulgacao-habilitacao'
import {
  descreverContagem,
  descreverDivulgacao,
  pluralizar,
  type Feedback,
} from './divulgar-resultado-texto'

interface Props {
  editalId: string
  resumo: ResumoDivulgacao
}

type AlvoDoFoco = 'gatilho' | 'confirmar' | 'feedback'

const ANEL_DE_FOCO =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{rotulo}</dt>
      <dd className="mt-0.5 text-slate-900">{valor}</dd>
    </div>
  )
}

/**
 * Divulgação do resultado da habilitação ao proponente.
 *
 * É o ato que publica: só depois dele o proponente vê habilitada/inabilitada e
 * a lista pública passa a incluir a inscrição. O e-mail de aviso vem marcado,
 * porque divulgar sem avisar deixaria o proponente descobrir por conta própria;
 * desmarcar é decisão de quem opera.
 *
 * A quantidade exibida na confirmação é enviada junto: se a lista mudou desde
 * que a tela abriu, o servidor recusa e o operador confere os números novos.
 */
export function DivulgarResultadoPanel({ editalId, resumo }: Props) {
  const router = useRouter()
  const [enviarEmail, setEnviarEmail] = useState(true)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const confirmarRef = useRef<HTMLButtonElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const alvoDoFoco = useRef<AlvoDoFoco | null>(null)

  const { habilitadas, inabilitadas, total } = resumo.aDivulgar

  // O elemento de destino só existe depois da renderização: os handlers
  // marcam para onde o foco vai e este efeito o move quando a tela já mudou.
  useEffect(() => {
    const destinos = { gatilho: gatilhoRef, confirmar: confirmarRef, feedback: feedbackRef }
    if (alvoDoFoco.current) destinos[alvoDoFoco.current].current?.focus()
    alvoDoFoco.current = null
  }, [confirmando, feedback])

  function abrirConfirmacao() {
    setFeedback(null)
    alvoDoFoco.current = 'confirmar'
    setConfirmando(true)
  }

  function cancelarConfirmacao() {
    alvoDoFoco.current = 'gatilho'
    setConfirmando(false)
  }

  function mostrarFeedback(novo: Feedback) {
    alvoDoFoco.current = 'feedback'
    setFeedback(novo)
  }

  async function divulgar() {
    setEnviando(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/editais/${editalId}/habilitacao/divulgar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enviarEmail, totalEsperado: total }),
      })
      const corpo = await res.json()
      if (!res.ok) {
        // Lista defasada: a confirmação fecha para o operador conferir os números atualizados.
        if (res.status === 409) {
          setConfirmando(false)
          router.refresh()
        }
        mostrarFeedback({ type: 'error', text: corpo.message ?? 'Não foi possível divulgar o resultado.' })
        return
      }
      mostrarFeedback(descreverDivulgacao(corpo.data, enviarEmail))
      setConfirmando(false)
      router.refresh()
    } catch {
      mostrarFeedback({ type: 'error', text: 'Falha de conexão. Tente novamente.' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section
      aria-labelledby="divulgar-resultado-titulo"
      className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <h2 id="divulgar-resultado-titulo" className="text-base font-semibold text-slate-900">
        Divulgar resultado da habilitação
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Enquanto o resultado não é divulgado, o proponente vê a inscrição como “Em análise” e a lista
        pública de habilitados fica vazia.
      </p>

      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Dado rotulo="Prontas para divulgar" valor={descreverContagem(habilitadas, inabilitadas)} />
        <Dado
          rotulo="Ainda em conferência"
          valor={resumo.emConferencia > 0 ? `${resumo.emConferencia} — não serão divulgadas agora` : 'Nenhuma'}
        />
        <Dado rotulo="Já divulgadas" valor={resumo.jaDivulgadas > 0 ? String(resumo.jaDivulgadas) : 'Nenhuma'} />
      </dl>

      {feedback && (
        <div ref={feedbackRef} tabIndex={-1} className={`mt-4 rounded-lg outline-none ${ANEL_DE_FOCO}`}>
          <InlineFeedback type={feedback.type} message={feedback.text} />
        </div>
      )}

      <div className="mt-5 border-t border-slate-100 pt-4">
        {total === 0 ? (
          <>
            <Button type="button" variant="outline" disabled>
              Divulgar resultado
            </Button>
            <p className="mt-2 text-sm text-slate-500">
              Não há resultado decidido aguardando divulgação. Quando a equipe decidir novas
              inscrições, elas aparecem aqui.
            </p>
          </>
        ) : (
          <>
            <label
              htmlFor="divulgar-enviar-email"
              className="flex min-h-[44px] max-w-xl cursor-pointer items-start gap-3"
            >
              <input
                id="divulgar-enviar-email"
                type="checkbox"
                checked={enviarEmail}
                onChange={(evento) => setEnviarEmail(evento.target.checked)}
                disabled={enviando}
                className={`mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 ${ANEL_DE_FOCO}`}
              />
              <span className="text-sm">
                <span className="font-medium text-slate-900">Enviar e-mail aos proponentes</span>
                <span className="block text-slate-500">
                  Cada um recebe o resultado da própria inscrição, com o motivo quando inabilitada.
                </span>
              </span>
            </label>

            {!confirmando ? (
              <Button ref={gatilhoRef} type="button" className="mt-3" onClick={abrirConfirmacao}>
                Divulgar resultado
              </Button>
            ) : (
              <div className="mt-3 max-w-xl rounded-lg border border-slate-300 bg-slate-50 p-3">
                <p className="text-sm text-slate-800">
                  Confirma a divulgação de {pluralizar(total, 'resultado', 'resultados')}? Eles passam a
                  aparecer para os proponentes e na lista pública
                  {enviarEmail ? ', e cada proponente recebe um e-mail.' : '. Nenhum e-mail será enviado.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button ref={confirmarRef} type="button" onClick={divulgar} loading={enviando}>
                    Confirmar divulgação
                  </Button>
                  <Button type="button" variant="ghost" onClick={cancelarConfirmacao} disabled={enviando}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
