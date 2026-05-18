import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface RecursoDecididoData {
  edital: string
  decisao: string
  url: string
}

export const recursoDecididoSubject = (d: RecursoDecididoData) =>
  `Recurso analisado — ${d.edital}`

export function RecursoDecidido({ edital, decisao, url }: RecursoDecididoData) {
  return (
    <Layout preview={`Recurso analisado no edital ${edital}: ${decisao}`}>
      <Heading style={styles.h1}>Recurso analisado</Heading>
      <Text style={styles.paragraph}>
        Seu recurso referente ao edital <strong>{edital}</strong> foi analisado.
      </Text>
      <Text style={styles.paragraph}>
        Decisão: <strong>{decisao}</strong>
      </Text>
      <CtaButton href={url} label="Ver detalhes na minha área" />
    </Layout>
  )
}
