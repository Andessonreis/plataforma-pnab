import { Heading, Link, Section, Text } from '@react-email/components'
import { Layout } from '../_shared/layout'
import { colors, styles } from '../_shared/theme'
import { DetalhesVisita, type DadosVisitaEmail } from './detalhes-visita'

// Vai para o responsável logo depois do pedido. O aviso de que a visita ainda não
// está confirmada vem da configuração do Memorial, editável pela equipe.
export interface MemorialSolicitacaoRecebidaData extends DadosVisitaEmail {
  nome: string
  aviso: string
  contatoEmail?: string
  /** Página "Falar com a Secretaria" já com o protocolo no assunto. */
  contatoUrl?: string
}

export const memorialSolicitacaoRecebidaSubject = (d: MemorialSolicitacaoRecebidaData) =>
  `Memorial de Irecê — pedido de visita ${d.protocolo} recebido`

export function MemorialSolicitacaoRecebida({ nome, aviso, contatoEmail, contatoUrl, ...visita }: MemorialSolicitacaoRecebidaData) {
  return (
    <Layout preview={`Recebemos seu pedido de visita (${visita.protocolo}). Ainda não está confirmado.`}>
      <Heading style={styles.h1}>Pedido de visita recebido</Heading>
      <Text style={styles.paragraph}>
        Olá, <strong>{nome}</strong>!
      </Text>

      <Section
        style={{
          backgroundColor: colors.warning,
          border: `1px solid ${colors.warningBorder}`,
          borderRadius: '8px',
          padding: '14px 16px',
          margin: '16px 0',
        }}
      >
        <Text style={{ ...styles.paragraph, margin: 0, color: colors.warningText }}>{aviso}</Text>
      </Section>

      <DetalhesVisita {...visita} />

      <Text style={styles.paragraph}>Guarde o número do protocolo: é por ele que a equipe localiza o seu pedido.</Text>
      {(contatoUrl || contatoEmail) && (
        <Text style={styles.paragraph}>
          Precisa mudar alguma coisa? Envie uma mensagem pela página{' '}
          {contatoUrl ? <Link href={contatoUrl}>Falar com a Secretaria</Link> : 'Falar com a Secretaria'} do portal
          {contatoEmail && (
            <>
              {' '}ou escreva para <strong>{contatoEmail}</strong>
            </>
          )}
          , informando o protocolo.
        </Text>
      )}
    </Layout>
  )
}
