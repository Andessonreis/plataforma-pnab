import { Heading, Text } from '@react-email/components'
import { CtaButton } from '../_shared/cta-button'
import { Layout } from '../_shared/layout'
import { styles } from '../_shared/theme'
import { DetalhesVisita, type DadosVisitaEmail } from './detalhes-visita'

// Alerta interno: vai para a equipe de Comunicação ativa e para o e-mail de contato
// do Memorial a cada pedido novo.
export interface MemorialNovaSolicitacaoData extends DadosVisitaEmail {
  nomeDestinatario: string
  tipoVisitante: string
  url: string
}

export const memorialNovaSolicitacaoSubject = (d: MemorialNovaSolicitacaoData) =>
  `Novo pedido de visita ao Memorial — ${d.protocolo}`

export function MemorialNovaSolicitacao({ nomeDestinatario, tipoVisitante, url, ...visita }: MemorialNovaSolicitacaoData) {
  return (
    <Layout preview={`${visita.instituicao} pediu visita para ${visita.data}`}>
      <Heading style={styles.h1}>Novo pedido de visita</Heading>
      <Text style={styles.paragraph}>
        Olá, <strong>{nomeDestinatario}</strong>!
      </Text>
      <Text style={styles.paragraph}>
        Chegou um pedido de visita ao Memorial ({tipoVisitante}). O horário fica reservado até a equipe confirmar ou
        recusar.
      </Text>

      <DetalhesVisita {...visita} />

      <CtaButton href={url} label="Analisar pedido" />
    </Layout>
  )
}
