import Link from 'next/link'
import { linkTexto } from '../estilos'

interface CabecalhoMemorialProps {
  titulo: string
  texto: string
  /** Atalho para a outra tela do Memorial (pedir visita / ver visitas). */
  atalho: { href: string; rotulo: string }
}

/** Cabeçalho das telas do Memorial no painel: título da identidade, uma frase de apoio e o atalho entre as duas telas. */
export function CabecalhoMemorial({ titulo, texto, atalho }: CabecalhoMemorialProps) {
  return (
    <header className="mb-8 border-b-2 border-tinta-900 pb-6">
      <h1 className="titulo text-4xl text-tinta-900 sm:text-5xl">{titulo}</h1>
      <p className="mt-3 max-w-prose text-tinta-700">{texto}</p>
      <Link href={atalho.href} className={`${linkTexto} mt-1`}>
        {atalho.rotulo}
      </Link>
    </header>
  )
}
