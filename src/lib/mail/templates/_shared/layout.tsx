import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'
import { colors, styles } from './theme'

interface LayoutProps {
  preview: string
  children: ReactNode
}

// Logo precisa ser servido via URL absoluta (clients de e-mail não resolvem
// caminhos relativos). Em prod sai do `NEXT_PUBLIC_SITE_URL`; fallback é o
// domínio oficial pra cobrir contextos onde a env não está carregada (worker,
// testes, etc.).
const SITE_URL_FALLBACK = 'https://culturaeturismo.irece.ba.gov.br'

function getLogoUrl(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL_FALLBACK
  return `${base.replace(/\/$/, '')}/images/logo-irece-color.png`
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={{ paddingBottom: '8px' }}>
            <Img
              src={getLogoUrl()}
              alt="Prefeitura de Irecê — Secretaria de Cultura e Turismo"
              width="280"
              height="40"
              style={{ display: 'block', margin: '0', maxWidth: '100%', height: 'auto' }}
            />
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
