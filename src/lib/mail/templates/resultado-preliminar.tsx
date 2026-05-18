import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface ResultadoPreliminarData {
  edital: string
  url: string
}

export const resultadoPreliminarSubject = (d: ResultadoPreliminarData) =>
  `Resultado preliminar publicado — ${d.edital}`

export function ResultadoPreliminar({ edital, url }: ResultadoPreliminarData) {
  return (
    <Layout preview={`Resultado preliminar do edital ${edital} foi publicado`}>
      <Heading style={styles.h1}>Resultado preliminar publicado</Heading>
      <Text style={styles.paragraph}>
        O resultado preliminar do edital <strong>{edital}</strong> está disponível.
      </Text>
      <Text style={styles.paragraph}>
        Consulte sua classificação e, se for o caso, interponha recurso dentro do prazo
        previsto no cronograma.
      </Text>
      <CtaButton href={url} label="Ver resultado" />
    </Layout>
  )
}
