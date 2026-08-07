import { IconMenu } from '@/components/ui'

/**
 * Gatilho flutuante do menu, só no mobile — sem barra superior por trás.
 * A sidebar fica escondida por padrão em telas estreitas (ver sidebar.tsx,
 * `input#sidebar-toggle`); isto é o único jeito de abri-la lá.
 */
export function MobileMenuButton() {
  return (
    <label
      id="tour-hamburguer"
      htmlFor="sidebar-toggle"
      className="fixed left-3 top-3 z-40 inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full bg-tinta-950/70 text-papel-50 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 lg:hidden"
      aria-label="Abrir menu"
    >
      <IconMenu className="h-5 w-5" />
    </label>
  )
}
