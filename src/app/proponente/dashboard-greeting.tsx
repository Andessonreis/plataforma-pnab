interface DashboardGreetingProps {
  firstName: string
  today: string
}

// Cabeçalho textual do painel — só a saudação, sem CTA nem destaque de urgência.
// Consumido pelo DashboardHero, que monta o restante do painel dominante.
export function DashboardGreeting({ firstName, today }: DashboardGreetingProps) {
  return (
    <div>
      <p className="rotulo text-papel-300/70">{today}</p>
      <h1 className="titulo mt-2 text-4xl leading-[0.95] text-papel-50 sm:text-5xl lg:text-6xl">
        Bem-vindo(a), {firstName}
      </h1>
    </div>
  )
}
