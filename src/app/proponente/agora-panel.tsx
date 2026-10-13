import Link from 'next/link'
import { IconArrowRight } from '@/components/ui'
import type { Agora, TomAgora } from './agora'
import { botaoContorno, botaoOuro } from './estilos'

/**
 * Fundo do bloco por situação. Os prazos (recurso e encerramento) e o
 * "nada pendente" ficam na tinta mais escura, o contraste máximo da tela;
 * rascunho e editais abertos levam turquesa (acolhimento) e oliva
 * (esperança). Em todos o botão principal é dourado.
 */
const FUNDO: Record<TomAgora, string> = {
  recurso: 'bg-tinta-950',
  prazo: 'bg-tinta-950',
  rascunho: 'bg-turquesa-800',
  abertos: 'bg-oliva-700',
  livre: 'bg-tinta-950',
}

/**
 * Bloco de abertura do painel: a ação mais urgente agora, com o botão
 * principal da tela. Usa o recorte de canto entalhado (`.cartela`) das peças
 * da Secretaria em vez de foto de fundo, então o texto não depende da imagem.
 */
export function AgoraPanel({ agora }: { agora: Agora }) {
  return (
    <section
      aria-label="O que precisa da sua atenção agora"
      className={`cartela flex flex-col justify-between p-6 [--cartela-filete:rgb(240_233_215/0.5)] text-papel-50 sm:p-8 ${FUNDO[agora.tom]}`}
    >
      <div>
        <p className="titulo text-4xl sm:text-5xl">{agora.destaque}</p>
        <p className="mt-4 max-w-xl text-lg leading-snug">{agora.detalhe}</p>
        {agora.complemento && <p className="mt-1 text-lg font-bold">{agora.complemento}</p>}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link id="tour-cta-principal" href={agora.cta.href} className={botaoOuro}>
          {agora.cta.label}
          <IconArrowRight className="h-4 w-4" />
        </Link>
        <Link id="tour-cta-inscricoes" href="/proponente/inscricoes" className={botaoContorno}>
          Minhas inscrições
        </Link>
      </div>
    </section>
  )
}
