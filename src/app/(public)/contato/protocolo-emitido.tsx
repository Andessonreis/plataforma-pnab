import { IconCheck } from '@/components/ui/icons'

interface ProtocoloEmitidoProps {
  protocolo: string
  aoEscreverOutra: () => void
}

/**
 * Comprovante do envio, com o número de protocolo em destaque.
 *
 * O protocolo é a única coisa que a pessoa precisa levar desta tela, então
 * vem em corpo grande e em fonte de largura fixa: é um código que será lido
 * em voz alta, copiado ou anotado à mão, e dígito ambíguo aqui vira mensagem
 * perdida.
 */
export function ProtocoloEmitido({ protocolo, aoEscreverOutra }: ProtocoloEmitidoProps) {
  return (
    <div className="border-2 border-tinta-900 bg-papel-100/70 p-8 text-center">
      <IconCheck className="mx-auto h-10 w-10 text-oliva-700" aria-hidden="true" />

      <h3 className="mt-4 font-rye text-xl leading-snug tracking-wide text-tinta-900">
        Mensagem enviada
      </h3>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-tinta-500">
        Número de protocolo
      </p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-brand-700">{protocolo}</p>

      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-tinta-600">
        Guarde este número para acompanhar o atendimento. Uma confirmação também segue para o
        e-mail informado.
      </p>

      <button
        type="button"
        onClick={aoEscreverOutra}
        className="mt-8 inline-flex min-h-[48px] items-center justify-center border-2 border-tinta-900 px-6 text-xs font-bold uppercase tracking-[0.14em] text-tinta-900 transition-colors hover:bg-tinta-900 hover:text-papel-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
      >
        Escrever outra mensagem
      </button>
    </div>
  )
}
