import { Heading, Text } from '@react-email/components'
import { Layout } from '../_shared/layout'
import { styles } from '../_shared/theme'
import { DetalhesVisita, type DadosVisitaEmail } from './detalhes-visita'

// Confirmação da equipe. Também serve quando a equipe remarca uma visita: aí o texto
// deixa claro que data ou horário mudaram.
export interface MemorialVisitaConfirmadaData extends DadosVisitaEmail {
  nome: string
  remarcada?: boolean
  contatoEmail?: string
}

export const memorialVisitaConfirmadaSubject = (d: MemorialVisitaConfirmadaData) =>
  d.remarcada
    ? `Memorial de Irecê — visita ${d.protocolo} remarcada`
    : `Memorial de Irecê — visita ${d.protocolo} confirmada`

export function MemorialVisitaConfirmada({ nome, remarcada, contatoEmail, ...visita }: MemorialVisitaConfirmadaData) {
  return (
    <Layout preview={remarcada ? `Sua visita mudou de data ou horário.` : `Sua visita ao Memorial está confirmada.`}>
      <Heading style={styles.h1}>{remarcada ? 'Visita remarcada' : 'Visita confirmada'}</Heading>
      <Text style={styles.paragraph}>
        Olá, <strong>{nome}</strong>!
      </Text>
      <Text style={styles.paragraph}>
        {remarcada
          ? 'A equipe do Memorial alterou a data ou o horário da sua visita. Confira como ficou:'
          : 'A equipe do Memorial confirmou a sua visita. Esperamos o grupo no dia e horário abaixo:'}
      </Text>

      <DetalhesVisita {...visita} />

      <Text style={styles.paragraph}>
        Chegue com alguns minutos de antecedência e lembre o grupo das regras de visitação que você aceitou no pedido.
      </Text>
      {contatoEmail && (
        <Text style={styles.paragraph}>
          Se precisar desmarcar, avise pelo e-mail <strong>{contatoEmail}</strong> informando o protocolo.
        </Text>
      )}
    </Layout>
  )
}
