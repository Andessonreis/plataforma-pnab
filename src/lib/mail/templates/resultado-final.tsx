import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface ResultadoFinalData {
  edital: string
  url: string
}

export const resultadoFinalSubject = (d: ResultadoFinalData) =>
  `Resultado final publicado — ${d.edital}`

export function ResultadoFinal({ edital, url }: ResultadoFinalData) {
  return (
    <Layout preview={`Resultado final do edital ${edital} foi publicado`}>
      <Heading style={styles.h1}>Resultado final publicado</Heading>
      <Text style={styles.paragraph}>
        O resultado final do edital <strong>{edital}</strong> foi publicado.
      </Text>
      <Text style={styles.paragraph}>
        Esta é a etapa conclusiva da seleção. Os contemplados receberão as próximas
        orientações nos prazos do edital.
      </Text>
      <CtaButton href={url} label="Ver resultado final" />
    </Layout>
  )
}
