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
  // Serif clássica para títulos — passa formalidade de documento oficial.
  // Georgia é email-safe (instalada em ~todos clients sem fallback de cache).
  serif: 'Georgia, "Times New Roman", Times, serif',
  // Sans neutra para o corpo — Arial/Helvetica em vez de system-ui para
  // evitar a aparência de "template moderno de SaaS".
  sans: 'Arial, Helvetica, sans-serif',
} as const

export const styles = {
  body: {
    backgroundColor: colors.background,
    fontFamily: fonts.sans,
    color: colors.text,
    margin: 0,
    padding: 0,
  },
  container: {
    backgroundColor: colors.surface,
    margin: '0 auto',
    padding: '0',
    maxWidth: '600px',
    border: `1px solid ${colors.border}`,
  },
  content: {
    padding: '28px 32px 8px',
  },
  h1: {
    color: colors.primaryDark,
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    margin: '0 0 18px',
  },
  paragraph: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: '15px',
    lineHeight: 1.65,
    margin: '0 0 14px',
  },
  hr: {
    borderColor: colors.border,
    margin: '24px 0',
  },
  footer: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: '12px',
    lineHeight: 1.5,
    margin: '0',
  },
  brand: {
    color: colors.textSubtle,
    fontFamily: fonts.sans,
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 4px',
  },
  // Topo: marca "100 anos" como faixa full-bleed. A imagem já traz o
  // próprio fundo preto nos pixels, então o Section em volta também é
  // preto pra integrar visualmente independente do modo (light/dark).
  // Sem padding — a marca toca as bordas como um banner institucional.
  logoSection: {
    backgroundColor: '#000000',
    padding: '0',
    fontSize: 0,
    lineHeight: 0,
  },
  // Faixa institucional verde escuro com brasão minimalista à esquerda.
  headerBar: {
    backgroundColor: colors.primaryDark,
    padding: '10px 28px',
  },
  headerBarBrasao: {
    display: 'inline-block' as const,
    verticalAlign: 'middle' as const,
    marginRight: '10px',
  },
  headerBarText: {
    color: '#ffffff',
    fontFamily: fonts.sans,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    lineHeight: '32px',
    margin: 0,
    textTransform: 'uppercase' as const,
    display: 'inline-block' as const,
    verticalAlign: 'middle' as const,
  },
} as const
