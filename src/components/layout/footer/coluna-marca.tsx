import Image from 'next/image'
import Link from 'next/link'

/**
 * Quem é a Secretaria e como falar com ela.
 *
 * O e-mail e o endereço vinham cada um dentro de um quadradinho arredondado com
 * um ícone — dois enfeites para dizer "isto é um e-mail", coisa que o próprio
 * endereço já diz. Sem os quadros, o e-mail pode ocupar o tamanho que merece:
 * num portal de editais, escrever para a Secretaria é a saída de emergência de
 * quem travou na inscrição, e era o menor texto do bloco.
 */
export function ColunaMarca() {
  return (
    <div className="lg:col-span-4">
      <Link
        href="/"
        className="group mb-4 flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-300"
      >
        <Image
          src="/images/secult/simbolo-secult.png"
          alt=""
          width={659}
          height={800}
          className="h-12 w-auto"
          aria-hidden="true"
        />
        <span>
          <span className="titulo block text-xl leading-none tracking-wide text-papel-50 transition-colors group-hover:text-accent-300">
            Portal PNAB
          </span>
          <span className="mt-1 block text-sm text-papel-200/70">Irecê, Bahia</span>
        </span>
      </Link>

      <p className="mb-5 max-w-sm text-[0.9375rem] leading-relaxed text-papel-200/80">
        Política Nacional Aldir Blanc de Fomento à Cultura, executada em Irecê pela Secretaria
        de Cultura e Turismo.
      </p>

      <p className="text-[0.9375rem] leading-relaxed text-papel-200/80">
        Dúvida sobre um edital ou problema na inscrição?
        <br />
        <a
          href="mailto:cultura@irece.ba.gov.br"
          className="mt-1 inline-block font-semibold text-papel-50 underline decoration-accent-300 decoration-2 underline-offset-4 transition-colors hover:text-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
        >
          cultura@irece.ba.gov.br
        </a>
      </p>
    </div>
  )
}
