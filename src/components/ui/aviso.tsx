import type { ReactNode } from 'react'

type TomAviso = 'sucesso' | 'erro' | 'atencao'

interface AvisoProps {
  tom: TomAviso
  children: ReactNode
}

/**
 * Recado de estado de um formulário — erro de envio, confirmação, ressalva.
 *
 * Estava copiado em entrar, criar conta e redefinir senha, e as cópias já
 * divergiam: a mesma mensagem saía ora com `role="alert"`, ora sem papel
 * nenhum. Aqui o papel ARIA passa a ser consequência do tom — erro interrompe
 * o leitor de tela, o resto é anunciado quando der.
 *
 * As cores são semânticas e não de marca: verde é sucesso e vermelho é erro em
 * qualquer paleta, e amarrar isso ao `brand` faria a confirmação de cadastro
 * sair terracota, que ninguém lê como "deu certo".
 */
const ESTILOS: Record<TomAviso, string> = {
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  erro: 'border-red-200 bg-red-50 text-red-900',
  atencao: 'border-amber-200 bg-amber-50 text-amber-900',
}

export function Aviso({ tom, children }: AvisoProps) {
  return (
    <p
      role={tom === 'erro' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${ESTILOS[tom]}`}
    >
      {children}
    </p>
  )
}
