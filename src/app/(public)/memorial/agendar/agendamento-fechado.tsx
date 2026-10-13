import type { Contato } from '@/lib/memorial/config'

/** Enquanto a equipe não publica o regulamento, não há como aceitar pedido. */
export function AgendamentoFechado({ contato }: { contato: Contato }) {
  return (
    <div className="border-2 border-tinta-900 bg-white p-6 sm:p-8">
      <h2 className="titulo text-2xl text-tinta-900">Agendamento em preparação</h2>
      <p className="mt-3 text-base leading-relaxed text-tinta-700">
        O pedido de visita pelo portal abre assim que a equipe do Memorial publicar o regulamento de visitação.
      </p>
      {(contato.email || contato.whatsapp || contato.telefone) && (
        <p className="mt-3 text-base leading-relaxed text-tinta-700">
          Para marcar agora, fale com a equipe
          {contato.email && (
            <>
              {' '}pelo e-mail{' '}
              <a className="font-semibold text-turquesa-800 underline underline-offset-4" href={`mailto:${contato.email}`}>
                {contato.email}
              </a>
            </>
          )}
          {(contato.whatsapp || contato.telefone) && <> ou pelo telefone {contato.whatsapp || contato.telefone}</>}.
        </p>
      )}
    </div>
  )
}
