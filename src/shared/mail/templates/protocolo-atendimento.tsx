import { Heading, Text } from '@react-email/components'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface ProtocoloAtendimentoData {
  protocolo: string
}

export const protocoloAtendimentoSubject = (d: ProtocoloAtendimentoData) =>
  `Protocolo de atendimento — ${d.protocolo}`

export function ProtocoloAtendimento({ protocolo }: ProtocoloAtendimentoData) {
  return (
    <Layout preview={`Protocolo de atendimento ${protocolo} registrado`}>
      <Heading style={styles.h1}>Atendimento registrado</Heading>
      <Text style={styles.paragraph}>
        Recebemos sua solicitação. Guarde este protocolo para acompanhamento:
      </Text>
      <Text style={{ ...styles.paragraph, fontSize: '20px', fontWeight: 600 }}>
        {protocolo}
      </Text>
      <Text style={styles.paragraph}>
        Responderemos no prazo de até <strong>5 dias úteis</strong>.
      </Text>
    </Layout>
  )
}
