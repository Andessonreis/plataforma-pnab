import { Heading, Section, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

export interface RecursoDecididoData {
  nome: string
  numero: string
  edital: string
  decisao: 'DEFERIDO' | 'INDEFERIDO'
  justificativa?: string
  url: string
}

export const recursoDecididoSubject = (d: RecursoDecididoData) =>
  `Resultado do recurso — Inscrição ${d.numero}`

export function RecursoDecidido({
  nome,
  numero,
  edital,
  decisao,
  justificativa,
  url,
}: RecursoDecididoData) {
  const isDeferido = decisao.toUpperCase() === 'DEFERIDO'

  return (
    <Layout preview={`Resultado do recurso (Inscrição ${numero}): ${decisao}`}>
      <Heading style={styles.h1}>Resultado do Recurso</Heading>
      
      <Text style={styles.paragraph}>
        Olá, <strong>{nome}</strong>!
      </Text>

      <Text style={styles.paragraph}>
        A análise do recurso referente à sua inscrição <strong>{numero}</strong> no edital <strong>{edital}</strong> foi concluída.
      </Text>

      <Section
        style={{
          backgroundColor: isDeferido ? colors.success : colors.warning,
          borderLeft: `4px solid ${isDeferido ? colors.successBorder : colors.warningBorder}`,
          borderRadius: '8px',
          padding: '16px',
          margin: '24px 0',
        }}
      >
        <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontWeight: 600 }}>
          Decisão da Comissão
        </Text>
        <Text
          style={{
            ...styles.paragraph,
            fontSize: '18px',
            fontWeight: 700,
            color: isDeferido ? colors.successText : colors.warningText,
            margin: '0 0 12px',
          }}
        >
          {decisao.toUpperCase()}
        </Text>

        {justificativa && (
          <>
            <Text style={{ ...styles.paragraph, margin: '0 0 4px', fontWeight: 600, fontSize: '13px' }}>
              Considerações:
            </Text>
            <Text style={{ ...styles.paragraph, margin: 0, fontSize: '14px', fontStyle: 'italic' }}>
              "{justificativa}"
            </Text>
          </>
        )}
      </Section>

      <Text style={styles.paragraph}>
        Você pode conferir o parecer detalhado e o andamento da sua inscrição acessando sua área restrita no portal.
      </Text>

      <CtaButton href={url} label="Acessar Área do Proponente" />
    </Layout>
  )
}
