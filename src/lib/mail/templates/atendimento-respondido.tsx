import { Heading, Section, Text } from '@react-email/components'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

export interface AtendimentoRespondidoData {
  nomeContato: string
  protocolo: string
  assunto: string
  resposta: string
}

export const atendimentoRespondidoSubject = (d: AtendimentoRespondidoData) =>
  `Resposta ao seu atendimento — ${d.protocolo}`

export function AtendimentoRespondido({ nomeContato, protocolo, assunto, resposta }: AtendimentoRespondidoData) {
  return (
    <Layout preview={`Nova resposta no atendimento ${protocolo}`}>
      <Heading style={styles.h1}>Seu atendimento foi respondido</Heading>
      <Text style={styles.paragraph}>
        Olá, <strong>{nomeContato}</strong>!
      </Text>
      <Text style={styles.paragraph}>
        A Secretaria de Arte e Cultura respondeu ao seu atendimento <strong>{protocolo}</strong> — assunto:{' '}
        <strong>{assunto}</strong>.
      </Text>
      <Section
        style={{
          backgroundColor: colors.success,
          borderLeft: `4px solid ${colors.successBorder}`,
          borderRadius: '8px',
          padding: '16px',
          margin: '24px 0',
        }}
      >
        <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontWeight: 600, fontSize: '13px' }}>
          Resposta:
        </Text>
        <Text style={{ ...styles.paragraph, margin: 0 }}>{resposta}</Text>
      </Section>
      <Text style={styles.paragraph}>
        Guarde o protocolo <strong>{protocolo}</strong> caso precise entrar em contato novamente.
      </Text>
    </Layout>
  )
}
