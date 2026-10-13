/**
 * Traçado do mapa de Irecê repetido como textura de marca por cima da foto.
 * Compartilhado entre a faixa dos editais e a do Memorial para a marca ter
 * a mesma presença nas duas.
 */
export function TexturaMapa() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
      style={{
        backgroundImage: 'url(/images/secult/mapa-irece.png)',
        backgroundSize: 'auto 100%',
        backgroundRepeat: 'repeat-x',
      }}
      aria-hidden="true"
    />
  )
}
