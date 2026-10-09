'use client'

import { useRouter } from 'next/navigation'
import type { StatusConteudo } from '@prisma/client'
import { IconCheckSimple } from '@/components/ui'
import { ROTULO_STATUS } from '@/lib/memorial/rotulos'
import { RecadoEnvio } from '../_componentes/recado-envio'
import { useEnvio } from '../_componentes/use-envio'
import { botaoNeutro, botaoPrimario } from './classes'
import { PASSOS_PUBLICACAO, indicePasso, outrosPassos, proximoPasso } from './config-fluxo'

interface Props {
  /** Endereço do registro na API; a troca de etapa vai para `${endpoint}/status`. */
  endpoint: string
  status: StatusConteudo
  /** O que falta para publicar, com a mesma regra que a API aplica. */
  pendencias: string[]
}

function Trilha({ status }: { status: StatusConteudo }) {
  const atual = indicePasso(status)
  return (
    <ol className="flex items-start" aria-label="Etapas até o site">
      {PASSOS_PUBLICACAO.map((passo, i) => {
        const feito = atual > i || status === 'PUBLICADO'
        const aqui = atual === i
        return (
          <li key={passo} aria-current={aqui ? 'step' : undefined} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span aria-hidden="true" className={`absolute right-1/2 top-3.5 h-0.5 w-full ${atual >= i ? 'bg-oliva-600' : 'bg-tinta-900/15'}`} />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                feito ? 'bg-oliva-600 text-white' : aqui ? 'bg-accent-500 text-tinta-900 ring-4 ring-accent-100' : 'border-2 border-tinta-900/20 bg-white text-tinta-600'
              }`}
            >
              {feito ? <IconCheckSimple className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`mt-1.5 text-xs leading-tight sm:text-sm ${aqui ? 'font-bold text-tinta-900' : 'font-medium text-tinta-600'}`}>
              {ROTULO_STATUS[passo]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Onde o conteúdo está no caminho até o site e um único botão para o próximo passo. */
export function FluxoPublicacao({ endpoint, status, pendencias }: Props) {
  const router = useRouter()
  const { enviando, recado, enviar } = useEnvio()
  const proximo = proximoPasso(status)
  const travado = proximo?.para === 'PUBLICADO' && pendencias.length > 0

  async function mudar(para: StatusConteudo) {
    if (await enviar(`${endpoint}/status`, 'POST', { status: para }, `Agora está como "${ROTULO_STATUS[para]}".`)) router.refresh()
  }

  return (
    <section aria-labelledby="fluxo-titulo" className="rounded-xl border border-tinta-900/10 bg-white p-4 sm:p-5">
      <h2 id="fluxo-titulo" className="sr-only">Publicação</h2>
      {status === 'ARQUIVADO' ? (
        <p className="rounded-lg bg-ameixa-100 px-3 py-2 text-sm font-medium text-ameixa-800">
          Arquivado: não aparece no site. Reabra como rascunho para voltar a trabalhar nele.
        </p>
      ) : (
        <Trilha status={status} />
      )}

      {status !== 'PUBLICADO' && status !== 'ARQUIVADO' && (
        <div className="mt-4 rounded-lg bg-papel-50 px-3 py-2.5 text-sm">
          {pendencias.length > 0 ? (
            <>
              <p className="font-semibold text-tinta-900">Para publicar falta:</p>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {pendencias.map((p) => (
                  <li key={p} className="flex items-center gap-1.5 text-tinta-800">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full border-2 border-accent-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-center gap-1.5 font-semibold text-oliva-800">
              <IconCheckSimple className="h-4 w-4" />
              Tudo preenchido para publicar
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {proximo && (
          <button type="button" className={`${botaoPrimario} w-full sm:w-auto`} disabled={enviando || travado} onClick={() => mudar(proximo.para)}>
            {proximo.rotulo}
          </button>
        )}
        {outrosPassos(status).map((p) => (
          <button key={p.para} type="button" className={`${botaoNeutro} flex-1 sm:flex-none`} disabled={enviando} onClick={() => mudar(p.para)}>
            {p.rotulo}
          </button>
        ))}
      </div>
      {travado && <p className="mt-2 text-sm text-tinta-600">Complete o que falta acima e salve; o botão libera sozinho.</p>}
      <div className="mt-3 empty:hidden">
        <RecadoEnvio recado={recado} />
      </div>
    </section>
  )
}
