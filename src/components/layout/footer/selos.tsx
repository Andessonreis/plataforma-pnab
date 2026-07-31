import { IconShield, IconAccessible, IconCheckSimple } from '@/components/ui/icons'

const SELOS = [
  { Icon: IconShield, titulo: 'PNAB', descricao: 'Lei Aldir Blanc', cor: 'text-accent-300' },
  { Icon: IconAccessible, titulo: 'WCAG AA', descricao: 'Acessibilidade', cor: 'text-agua-300' },
  { Icon: IconCheckSimple, titulo: '100% Digital', descricao: 'Processos online', cor: 'text-oliva-200' },
] as const

/** Selos de conformidade exibidos no rodapé. */
export function Selos() {
  return (
    <div className="lg:col-span-2">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-papel-50">
        Certificações
      </h2>
      <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-3">
        {SELOS.map((selo) => (
          <div
            key={selo.titulo}
            className="flex items-center gap-2.5 rounded-md border border-papel-100/10 bg-papel-100/[0.04] px-3 py-2.5 transition-colors hover:bg-papel-100/[0.08] sm:px-3.5 sm:py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-papel-100/10 sm:h-8 sm:w-8">
              <selo.Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${selo.cor}`} />
            </span>
            <div>
              <p className="text-xs font-semibold text-papel-100">{selo.titulo}</p>
              <p className="mt-0.5 hidden text-[10px] text-papel-200/50 sm:block">
                {selo.descricao}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
