import Image from 'next/image'

interface AssinaturaSecultProps {
  /** Sobre fundo escuro o nome sai em papel; sobre claro, em tinta. */
  escuro?: boolean
  className?: string
}

/**
 * Assinatura da Secretaria: o mandacaru sobre o nome, em duas linhas.
 *
 * É o arranjo do manual — símbolo centralizado e, abaixo, "SECRETARIA DE /
 * CULTURA E TURISMO" na fonte principal, em caixa alta. O nome é texto de
 * verdade, e não parte da imagem: assim é lido por leitor de tela, encontrado
 * pela busca e continua nítido em qualquer tamanho de tela.
 *
 * O símbolo é a marca da Secretaria e entra como imagem, sem alteração.
 */
export function AssinaturaSecult({ escuro = false, className = '' }: AssinaturaSecultProps) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <Image
        src="/images/secult/simbolo-secult.png"
        alt=""
        width={659}
        height={800}
        className="h-20 w-auto sm:h-24"
        aria-hidden="true"
      />
      <p
        className={`titulo mt-4 text-lg leading-[1.1] sm:text-xl ${
          escuro ? 'text-papel-50' : 'text-tinta-900'
        }`}
      >
        Secretaria de
        <br />
        Cultura e Turismo
      </p>
    </div>
  )
}
