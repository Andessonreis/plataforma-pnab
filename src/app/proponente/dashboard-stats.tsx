import { StaggerContainer, StaggerItem, CountUp } from '@/components/ui'

interface DashboardStatsProps {
  total: number
  pendentes: number
  contempladas: number
  editaisAbertos: number
}

interface NumeroPainel {
  rotulo: string
  valor: number
  destaque?: boolean
}

// Faixa de indicadores do proponente — números soltos lado a lado, sem
// cartão nem ícone por métrica (padrão da faixa institucional usada em
// (public)/editais). Só "Contempladas" ganha brand-700: é o único estado de
// sucesso/aprovado da faixa, o resto é contagem neutra.
export function DashboardStats({ total, pendentes, contempladas, editaisAbertos }: DashboardStatsProps) {
  const numeros: NumeroPainel[] = [
    { rotulo: 'Total de inscrições', valor: total },
    { rotulo: 'Pendentes', valor: pendentes },
    { rotulo: 'Contempladas', valor: contempladas, destaque: true },
    { rotulo: 'Editais abertos', valor: editaisAbertos },
  ]

  return (
    <StaggerContainer
      className="grid grid-cols-2 gap-6 border-y border-slate-200 py-6 sm:grid-cols-4 sm:gap-8"
      staggerDelay={0.08}
    >
      {numeros.map((item) => (
        <StaggerItem key={item.rotulo}>
          <CountUp
            value={item.valor}
            className={`titulo block text-4xl sm:text-5xl ${
              item.destaque ? 'text-brand-700' : 'text-tinta-950'
            }`}
          />
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">{item.rotulo}</p>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
