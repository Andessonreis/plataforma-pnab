import { FotoComCredito, type FotoPublica } from './foto-com-credito'

/**
 * Fotos em colunas de alturas livres (como um mural de cópias), uma coluna no
 * celular, duas no tablet e três no desktop.
 */
export function GradeFotos({ fotos }: { fotos: FotoPublica[] }) {
  return (
    <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5 [&>li]:break-inside-avoid">
      {fotos.map((foto, i) => (
        <li key={foto.id}>
          <FotoComCredito
            foto={foto}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            proporcao={i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/3]'}
          />
        </li>
      ))}
    </ul>
  )
}
