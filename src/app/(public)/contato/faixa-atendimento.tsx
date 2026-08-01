import { IconClock, IconMail, IconMapPin } from '@/components/ui/icons'

/**
 * Dados da Secretaria em faixa de rodapé, no lugar da barra lateral.
 *
 * Endereço, e-mail e horário não competem com o formulário: são o que se
 * consulta antes de escrever ou depois de enviar. Na lateral, disputavam
 * atenção com os campos e ainda espremiam o formulário em dois terços da
 * página. Aqui ocupam a largura inteira, como o rodapé de um impresso
 * oficial.
 */
export function FaixaAtendimento() {
  return (
    <section className="bg-tinta-950 text-papel-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="titulo text-2xl leading-tight tracking-wide text-papel-50">
          Secretaria de Cultura e Turismo
        </h2>

        <dl className="mt-8 grid gap-8 sm:grid-cols-3">
          <div className="flex gap-4 border-t border-papel-100/20 pt-5">
            <IconMail className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
                E-mail
              </dt>
              <dd className="mt-1">
                <a
                  href="mailto:cultura@irece.ba.gov.br"
                  className="text-sm text-accent-300 underline-offset-4 hover:underline"
                >
                  cultura@irece.ba.gov.br
                </a>
              </dd>
            </div>
          </div>

          <div className="flex gap-4 border-t border-papel-100/20 pt-5">
            <IconMapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
                Endereço
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-papel-100/90">
                Praça Teotônio Marques Dourado, s/n
                <br />
                Centro, Irecê/BA — CEP 44900-000
              </dd>
            </div>
          </div>

          <div className="flex gap-4 border-t border-papel-100/20 pt-5">
            <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-papel-200/80">
                Atendimento
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-papel-100/90">
                Segunda a sexta
                <br />
                08h às 12h e 14h às 17h
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </section>
  )
}
