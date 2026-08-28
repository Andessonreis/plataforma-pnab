import Image from 'next/image'

const ANO_INICIAL = 2026

/**
 * O fecho do rodapé: de quem é o portal, com que dinheiro ele funciona e quem
 * o construiu.
 *
 * Isso vinha repartido em três faixas empilhadas, cada uma com seu fio por
 * cima — crédito do IFBA numa, copyright noutra, brasão numa terceira — mais um
 * bloco de "Certificações" com três selos que o próprio site se dava ("100%
 * Digital", "WCAG AA"). Selo que a casa emite sobre si mesma não informa nada a
 * quem chega, e três faixas para responder uma pergunta só ("de quem é isto?")
 * é o que fazia o rodapé parecer uma pilha de tiras.
 *
 * Ficou uma faixa: a origem à esquerda, a autoria à direita. A menção à lei
 * substitui os selos porque é a única credencial aqui que alguém pode conferir.
 */
export function Assinatura() {
  const ano = new Date().getFullYear()
  const periodo = ano > ANO_INICIAL ? `${ANO_INICIAL}-${ano}` : String(ANO_INICIAL)

  return (
    <div className="border-t border-papel-100/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-8">
        <div className="flex items-start gap-4">
          <Image
            src="/images/marca/brasao-irece.png"
            alt=""
            width={28}
            height={28}
            className="mt-0.5 h-10 w-auto shrink-0"
            aria-hidden="true"
          />
          <div className="text-sm leading-relaxed text-papel-200/75">
            <p className="font-semibold text-papel-100">
              Secretaria de Cultura e Turismo de Irecê
            </p>
            <p className="mt-0.5">
              Prefeitura Municipal de Irecê, Bahia. &copy; {periodo}
            </p>
            <p className="mt-2 max-w-md">
              Recursos da Política Nacional Aldir Blanc de Fomento à Cultura, instituída pela
              Lei nº 14.399/2022.
            </p>
          </div>
        </div>

        <a
          href="https://cidadesinteligentes.ifba.edu.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="group shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-300"
        >
          <span className="block text-sm text-papel-200/75">Desenvolvido no</span>
          <Image
            src="/images/marca/logo-cidades-inteligentes-white.png"
            alt="Projeto Cidades Inteligentes Municípios, IFBA campus Irecê"
            width={649}
            height={185}
            className="mt-2 h-10 w-auto opacity-90 transition-opacity group-hover:opacity-100 sm:h-11"
          />
        </a>
      </div>
    </div>
  )
}
