import Link from 'next/link'
import { linkFalarComSecretaria } from '@/lib/memorial/agendamento/contato-secretaria'

interface AjudaVisitaProps {
  /** E-mail institucional do Memorial (configuração); some quando não houver. */
  contatoEmail: string
  protocolo?: string
  className?: string
}

const LINK = 'font-semibold text-turquesa-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turquesa-700'

/**
 * Onde pedir ajuda ou mudança num pedido de visita. O canal principal é a página
 * "Falar com a Secretaria", que não depende de a pessoa abrir o próprio e-mail; o
 * endereço do Memorial continua como alternativa.
 */
export function AjudaVisita({ contatoEmail, protocolo, className = '' }: AjudaVisitaProps) {
  return (
    <p className={`text-sm leading-relaxed text-tinta-700 ${className}`}>
      {protocolo ? 'Precisa mudar algo neste pedido? ' : 'Dúvidas sobre o agendamento? '}
      <Link href={linkFalarComSecretaria(protocolo)} className={LINK}>
        Falar com a Secretaria
      </Link>{' '}
      pelo portal{protocolo && <>, citando o protocolo {protocolo}</>}
      {contatoEmail && (
        <>
          , ou escreva para{' '}
          <a href={`mailto:${contatoEmail}`} className={LINK}>
            {contatoEmail}
          </a>
        </>
      )}
      .
    </p>
  )
}
