import Image from 'next/image'
import Link from 'next/link'
import { focoEscuro, focoPapel } from './estilos'

interface BrandLockupProps {
  /** `completa`: logo horizontal (símbolo + nome), na etiqueta de papel do menu lateral; `compacta`: símbolo e nome em texto claro, para a barra escura do celular. */
  variante: 'completa' | 'compacta'
}

/**
 * Marca da Secretaria de Cultura e Turismo de Irecê. O portal é da
 * Secretaria; o PNAB é uma das ações que ela executa por aqui, e aparece só
 * como contexto das inscrições. O logo horizontal tem letreiro em tinta, então
 * só aparece sobre papel; no fundo escuro do celular o nome vai em texto.
 */
export function BrandLockup({ variante }: BrandLockupProps) {
  if (variante === 'completa') {
    return (
      <Link href="/proponente" aria-label="Secretaria de Cultura e Turismo de Irecê, ir para o início" className={`block w-fit ${focoPapel}`}>
        <Image
          src="/images/secult/logo-secult-horizontal.png"
          alt="Secretaria de Cultura e Turismo, Prefeitura de Irecê"
          width={208}
          height={103}
          priority
        />
      </Link>
    )
  }

  return (
    <Link href="/proponente" aria-label="Secretaria de Cultura e Turismo de Irecê, ir para o início" className={`flex items-center gap-2.5 ${focoEscuro}`}>
      <Image src="/images/secult/simbolo-secult.png" alt="" width={659} height={800} className="h-9 w-auto" aria-hidden="true" priority />
      <span className="text-sm font-bold leading-tight text-papel-50">
        Secretaria de Cultura e Turismo de Irecê
      </span>
    </Link>
  )
}
