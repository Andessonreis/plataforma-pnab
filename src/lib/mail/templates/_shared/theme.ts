// Paleta e estilos compartilhados entre templates de e-mail.
// Mantém consistência visual e cumpre contraste AA (WCAG).

export const colors = {
  primary: '#059669',
  primaryDark: '#047857',
  text: '#1f2937',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  border: '#e5e7eb',
  background: '#f9fafb',
  surface: '#ffffff',
  warning: '#fef3c7',
  warningBorder: '#f59e0b',
  warningText: '#92400e',
} as const

export const fonts = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
} as const

export const styles = {
  body: {
    backgroundColor: colors.background,
    fontFamily: fonts.sans,
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: colors.surface,
    margin: '0 auto',
    padding: '32px 24px',
    maxWidth: '560px',
  },
  h1: {
    color: colors.primaryDark,
    fontSize: '22px',
    fontWeight: 600,
    lineHeight: 1.3,
    margin: '0 0 16px',
  },
  paragraph: {
    color: colors.text,
    fontSize: '15px',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },
  hr: {
    borderColor: colors.border,
    margin: '24px 0',
  },
  footer: {
    color: colors.textMuted,
    fontSize: '12px',
    lineHeight: 1.5,
    margin: '0',
  },
  brand: {
    color: colors.textSubtle,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 4px',
  },
} as const
