import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface NotificacaoPrazoData {
  mensagem: string
  url: string
}

export const notificacaoPrazoSubject = () => 'Lembrete de prazo — Portal PNAB Irecê'

export function NotificacaoPrazo({ mensagem, url }: NotificacaoPrazoData) {
  return (
    <Layout preview="Lembrete de prazo no Portal PNAB Irecê">
      <Heading style={styles.h1}>Lembrete de prazo</Heading>
      <Text style={styles.paragraph}>{mensagem}</Text>
      <CtaButton href={url} label="Acessar portal" />
    </Layout>
  )
}
