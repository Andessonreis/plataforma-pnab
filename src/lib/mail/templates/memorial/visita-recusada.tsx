import { Heading, Section, Text } from '@react-email/components'
import { Layout } from '../_shared/layout'
import { colors, styles } from '../_shared/theme'
import { DetalhesVisita, type DadosVisitaEmail } from './detalhes-visita'

// Recusa de um pedido ou cancelamento de uma visita já marcada — sempre com o motivo.
export interface MemorialVisitaRecusadaData extends DadosVisitaEmail {
  nome: string
  situacao: 'RECUSADA' | 'CANCELADA'
  motivo: string
  contatoEmail?: string
}

export const memorialVisitaRecusadaSubject = (d: MemorialVisitaRecusadaData) =>
  d.situacao === 'CANCELADA'
    ? `Memorial de Irecê — visita ${d.protocolo} cancelada`
    : `Memorial de Irecê — pedido de visita ${d.protocolo} não atendido`

export function MemorialVisitaRecusada({ nome, situacao, motivo, contatoEmail, ...visita }: MemorialVisitaRecusadaData) {
  const cancelada = situacao === 'CANCELADA'
  return (
    <Layout preview={cancelada ? 'Sua visita ao Memorial foi cancelada.' : 'Não foi possível atender o seu pedido de visita.'}>
      <Heading style={styles.h1}>{cancelada ? 'Visita cancelada' : 'Pedido de visita não atendido'}</Heading>
      <Text style={styles.paragraph}>
        Olá, <strong>{nome}</strong>.
      </Text>
      <Text style={styles.paragraph}>
        {cancelada
          ? 'A visita abaixo foi cancelada pela equipe do Memorial.'
          : 'A equipe do Memorial analisou o seu pedido e não vai conseguir receber o grupo nesta data.'}
      </Text>

      <DetalhesVisita {...visita} />

      <Section
        style={{
          backgroundColor: colors.warning,
          borderLeft: `4px solid ${colors.warningBorder}`,
          borderRadius: '8px',
          padding: '14px 16px',
          margin: '16px 0',
        }}
      >
        <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontWeight: 600 }}>Motivo informado pela equipe</Text>
        <Text style={{ ...styles.paragraph, margin: 0, color: colors.warningText }}>{motivo}</Text>
      </Section>

      <Text style={styles.paragraph}>Você pode fazer um novo pedido para outra data pelo portal.</Text>
      {contatoEmail && (
        <Text style={styles.paragraph}>
          Dúvidas: <strong>{contatoEmail}</strong>.
        </Text>
      )}
    </Layout>
  )
}
