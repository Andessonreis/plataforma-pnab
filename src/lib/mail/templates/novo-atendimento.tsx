import { Heading, Section, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

// Disparado pra equipe interna (ADMIN + ATENDIMENTO ativos) toda vez que um
// atendimento é aberto — pelo formulário público de contato ou criado
// diretamente via API. Não confundir com `atendimento_respondido`, que vai
// pro autor do atendimento quando a equipe responde.
export interface NovoAtendimentoData {
  nomeAtendente: string
  protocolo: string
  nomeContato: string
  assunto: string
  mensagem: string
  url: string
}

export const novoAtendimentoSubject = (d: NovoAtendimentoData) =>
  `Novo atendimento — ${d.protocolo}`

export function NovoAtendimento({
  nomeAtendente,
  protocolo,
  nomeContato,
  assunto,
  mensagem,
  url,
}: NovoAtendimentoData) {
  return (
    <Layout preview={`Novo atendimento de ${nomeContato}: ${assunto}`}>
      <Heading style={styles.h1}>Novo atendimento recebido</Heading>

      <Text style={styles.paragraph}>
        Olá, <strong>{nomeAtendente}</strong>!
      </Text>

      <Text style={styles.paragraph}>
        <strong>{nomeContato}</strong> abriu um atendimento — protocolo <strong>{protocolo}</strong>,
        assunto: <strong>{assunto}</strong>.
      </Text>

      <Section
        style={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '16px 18px',
          margin: '16px 0',
        }}
      >
        <Text style={{ ...styles.paragraph, margin: 0 }}>{mensagem}</Text>
      </Section>

      <CtaButton href={url} label="Responder atendimento" />
    </Layout>
  )
}
