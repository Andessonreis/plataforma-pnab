'use client'

import { useRouter } from 'next/navigation'
import type { StatusConteudo } from '@prisma/client'
import { IconCheckSimple } from '@/components/ui'
import { ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { useEnvio } from '../_componentes/use-envio'
import { PASSOS_PUBLICACAO, acoesDaSituacao, indicePasso, juntarLista } from './acervo-fluxo'
import { botaoPrimario } from './classes'

interface Props {
  /** Endereço do registro na API, ex.: /api/v1/memorial/acervo/abc */
  endpoint: string
  status: StatusConteudo
  /** O que falta para publicar, calculado com os valores que estão no formulário. */
  pendencias: string[]
  /** Há alterações não salvas: mudar a situação agora usaria a versão antiga. */
  alteracoesPendentes: boolean
}

/**
 * Trilha Rascunho → Em revisão → Aprovado → Publicado, o que falta para publicar
 * e um único botão para o próximo passo. Recuar e arquivar ficam discretos ao lado.
 */
export function AcervoPassos({ endpoint, status, pendencias, alteracoesPendentes }: Props) {
  const router = useRouter()
  const { enviando, recado, enviar } = useEnvio()
  const { principal, secundarias } = acoesDaSituacao(status)
  const atual = indicePasso(status)
  const bloqueiaPublicar = principal?.para === 'PUBLICADO' && pendencias.length > 0

  async function mudar(para: StatusConteudo) {
    const ok = await enviar(`${endpoint}/status`, 'POST', { status: para }, `Situação alterada para "${ROTULO_STATUS[para]}".`)
    if (ok) router.refresh()
  }

  return (
    <section aria-labelledby="titulo-situacao" className="rounded-xl border border-tinta-900/10 bg-white p-4 sm:p-5">
      <h2 id="titulo-situacao" className="sr-only">
        Situação da publicação
      </h2>

      {status === 'ARQUIVADO' ? (
        <p className="rounded-lg bg-ameixa-100 px-3 py-2 text-sm font-semibold text-ameixa-800">
          Arquivado: guardado no acervo, fora do site e fora da fila de trabalho.
        </p>
      ) : (
        <ol className="grid grid-cols-4 gap-1">
          {PASSOS_PUBLICACAO.map((passo, i) => {
            const feito = i < atual
            const agora = i === atual
            return (
              <li key={passo} aria-current={agora ? 'step' : undefined} className="flex flex-col items-start gap-1.5">
                <span className={`h-1.5 w-full rounded-full ${feito ? 'bg-oliva-600' : agora ? 'bg-brand-600' : 'bg-tinta-900/10'}`} />
                <span
                  className={`flex items-center gap-1 text-xs sm:text-sm ${
                    agora ? 'font-bold text-tinta-900' : feito ? 'font-semibold text-oliva-800' : 'text-tinta-600'
                  }`}
                >
                  {feito && <IconCheckSimple className="h-3.5 w-3.5 shrink-0" />}
                  {ROTULO_STATUS[passo]}
                  {feito && <span className="sr-only">(concluído)</span>}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Pendencias status={status} pendencias={pendencias} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {secundarias.map((a) => (
            <button
              key={a.para}
              type="button"
              disabled={enviando || alteracoesPendentes}
              onClick={() => mudar(a.para)}
              className="min-h-[44px] text-sm font-semibold text-tinta-700 underline-offset-4 hover:text-brand-700 hover:underline disabled:opacity-50"
            >
              {a.rotulo}
            </button>
          ))}
          {principal && (
            <button
              type="button"
              className={botaoPrimario}
              disabled={enviando || alteracoesPendentes || bloqueiaPublicar}
              onClick={() => mudar(principal.para)}
            >
              {principal.rotulo}
            </button>
          )}
        </div>
      </div>

      {alteracoesPendentes && (
        <p className="mt-3 text-sm text-tinta-700">Salve as alterações antes de mudar a situação.</p>
      )}
      <div className="mt-3 empty:hidden">
        <RecadoEnvio recado={recado} />
      </div>
    </section>
  )
}

/** Checklist curto: a cor acompanha um texto, nunca sozinha. */
function Pendencias({ status, pendencias }: { status: StatusConteudo; pendencias: string[] }) {
  if (status === 'PUBLICADO') {
    return <p className="text-sm font-semibold text-oliva-800">No ar no site.</p>
  }
  if (pendencias.length > 0) {
    return (
      <p className="rounded-lg bg-accent-100 px-3 py-2 text-sm text-accent-900">
        Para publicar falta: <strong className="font-bold">{juntarLista(pendencias)}</strong>
      </p>
    )
  }
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-oliva-800">
      <IconCheckSimple className="h-4 w-4" />
      Pronta para publicar
    </p>
  )
}
