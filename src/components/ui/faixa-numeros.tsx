import { StaggerContainer, StaggerItem, CountUp } from '@/components/ui/animated'

export interface NumeroDestaque {
  valor: string
  rotulo: string
}

interface FaixaNumerosProps {
  numeros: NumeroDestaque[]
}

/**
 * Faixa de indicadores do portal, logo abaixo da abertura.
 *
 * Compartilhada entre a home e a listagem de editais: as duas abrem com uma
 * faixa fotográfica e precisam do mesmo placar institucional logo depois,
 * antes de qualquer filtro ou lista.
 */
export function FaixaNumeros({ numeros }: FaixaNumerosProps) {
  return (
    <section className="border-b-2 border-tinta-900/10 bg-papel-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <StaggerContainer
          className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8"
          staggerDelay={0.12}
        >
          {numeros.map((item) => (
            <StaggerItem key={item.rotulo} className="text-center">
              <CountUp value={item.valor} className="titulo text-2xl text-brand-700 sm:text-3xl" />
              <p className="mt-1 text-xs text-tinta-700 sm:text-sm">{item.rotulo}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
