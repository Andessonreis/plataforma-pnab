import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface RecursoSubmetidoData {
  edital: string
  fase: string
  url: string
}

export const recursoSubmetidoSubject = (d: RecursoSubmetidoData) =>
  `Novo recurso recebido — ${d.edital}`

export function RecursoSubmetido({ edital, fase, url }: RecursoSubmetidoData) {
  return (
    <Layout preview={`Novo recurso interposto no edital ${edital}`}>
      <Heading style={styles.h1}>Novo recurso recebido</Heading>
      <Text style={styles.paragraph}>
        Um recurso foi interposto para o edital <strong>{edital}</strong>.
      </Text>
      <Text style={styles.paragraph}>
        Fase: <strong>{fase}</strong>
      </Text>
      <CtaButton href={url} label="Analisar no painel" />
    </Layout>
  )
}
