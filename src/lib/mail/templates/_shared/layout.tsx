import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'
import { colors, styles } from './theme'

interface LayoutProps {
  preview: string
  children: ReactNode
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>
            <Text style={styles.brand}>Portal PNAB Irecê</Text>
          </Section>
          {children}
          <Hr style={styles.hr} />
          <Section>
            <Text style={styles.footer}>
              Secretaria de Arte e Cultura — Prefeitura Municipal de Irecê/BA
            </Text>
            <Text style={{ ...styles.footer, color: colors.textSubtle, marginTop: '6px' }}>
              Este é um e-mail automático. Para suporte, acesse o portal e abra um chamado.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
