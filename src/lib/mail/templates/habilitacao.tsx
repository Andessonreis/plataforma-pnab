import { Heading, Section, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

export interface HabilitacaoData {
  nome: string
  numero: string
  edital: string
  resultado: 'HABILITADA' | 'INABILITADA' | string
  motivo?: string
  url: string
}

export const habilitacaoSubject = (d: HabilitacaoData) =>
  `Resultado da habilitação — Inscrição ${d.numero}`

export function Habilitacao({
  nome,
  numero,
  edital,
  resultado,
  motivo,
  url,
}: HabilitacaoData) {
  const isInabilitada = resultado !== 'HABILITADA'

  return (
    <Layout
      preview={`Inscrição ${numero}: ${isInabilitada ? 'INABILITADA' : 'HABILITADA'}`}
    >
      <Heading style={styles.h1}>Resultado da habilitação</Heading>
      <Text style={styles.paragraph}>
        Olá, <strong>{nome}</strong>!
      </Text>
      <Text style={styles.paragraph}>
        Sua inscrição <strong>{numero}</strong> no edital <strong>{edital}</strong> foi
        analisada na fase de habilitação.
      </Text>
      <Text style={styles.paragraph}>
        Resultado: <strong>{isInabilitada ? 'INABILITADA' : 'HABILITADA'}</strong>
      </Text>

      {isInabilitada && motivo && (
        <Section
          style={{
            backgroundColor: colors.warning,
            borderLeft: `4px solid ${colors.warningBorder}`,
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '16px 0',
          }}
        >
          <Text style={{ ...styles.paragraph, margin: '0 0 8px', fontWeight: 600 }}>
            Motivo da inabilitação
          </Text>
          <Text style={{ ...styles.paragraph, margin: '0 0 8px' }}>{motivo}</Text>
          <Text
            style={{
              ...styles.paragraph,
              fontSize: '13px',
              color: colors.warningText,
              margin: 0,
            }}
          >
            <strong>Atenção:</strong> você pode interpor recurso contra esta decisão
            dentro do prazo previsto no cronograma do edital.
          </Text>
        </Section>
      )}

      <CtaButton href={url} label="Acessar minha área" />
    </Layout>
  )
}
