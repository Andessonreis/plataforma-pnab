import type { ConviteMemorial } from './tipos'

/**
 * Como a visita acontece, em três passos. A numeração aqui carrega informação
 * (é uma sequência de verdade: sem pedir não há confirmação), por isso fica.
 * As frases de regra vêm das configurações do Memorial.
 */
export function PassosVisita({ regras }: { regras: ConviteMemorial['regras'] }) {
  const passos = [
    { titulo: 'Peça o horário', texto: `${regras.grupo} ${regras.antecedencia}` },
    { titulo: 'Aguarde a confirmação', texto: 'A equipe do Memorial confere a agenda e responde. O pedido só vale depois da confirmação.' },
    { titulo: 'Venha com o grupo', texto: regras.quando },
  ]

  return (
    <ol className="grid gap-6 sm:grid-cols-3 sm:gap-8">
      {passos.map((passo, i) => (
        <li key={passo.titulo} className="border-t-2 border-tinta-900/80 pt-4">
          <span className="titulo text-4xl leading-none text-brand-700" aria-hidden="true">
            {i + 1}
          </span>
          <h4 className="titulo mt-2 text-xl tracking-wide text-tinta-900">
            <span className="sr-only">Passo {i + 1}: </span>
            {passo.titulo}
          </h4>
          <p className="mt-1.5 text-base leading-relaxed text-tinta-700">{passo.texto}</p>
        </li>
      ))}
    </ol>
  )
}
