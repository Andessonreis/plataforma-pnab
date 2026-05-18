import { Button, Section } from '@react-email/components'
import { colors } from './theme'

interface CtaButtonProps {
  href: string
  label: string
}

export function CtaButton({ href, label }: CtaButtonProps) {
  return (
    <Section style={{ margin: '20px 0' }}>
      <Button
        href={href}
        style={{
          backgroundColor: colors.primary,
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '15px',
          fontWeight: 600,
          padding: '12px 24px',
          textDecoration: 'none',
        }}
      >
        {label}
      </Button>
    </Section>
  )
}
