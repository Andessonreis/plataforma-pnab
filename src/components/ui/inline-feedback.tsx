import { IconCheckSimple, IconClose } from './icons'

export interface InlineFeedbackProps {
  type: 'success' | 'error'
  message: string
}

const STYLES = {
  success: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: 'text-emerald-500',
  },
  error: {
    container: 'bg-red-50 text-red-700 border-red-200',
    icon: 'text-red-500',
  },
} as const

/** Alerta inline compacto para feedback de ações (ex.: adicionar/remover item de uma lista). */
export function InlineFeedback({ type, message }: InlineFeedbackProps) {
  const styles = STYLES[type]
  const Icon = type === 'success' ? IconCheckSimple : IconClose

  return (
    <div
      role="alert"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${styles.container}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${styles.icon}`} />
      <span>{message}</span>
    </div>
  )
}
