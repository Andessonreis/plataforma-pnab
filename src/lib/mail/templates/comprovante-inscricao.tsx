import { Heading, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { styles } from './_shared/theme'

export interface ComprovanteInscricaoData {
  numero: string
  edital: string
  url: string
}

export const comprovanteInscricaoSubject = (d: ComprovanteInscricaoData) =>
  `Inscrição ${d.numero} recebida — ${d.edital}`

export function ComprovanteInscricao({ numero, edital, url }: ComprovanteInscricaoData) {
  return (
    <Layout preview={`Inscrição ${numero} recebida no edital ${edital}`}>
      <Heading style={styles.h1}>Inscrição recebida com sucesso!</Heading>
      <Text style={styles.paragraph}>
        Sua inscrição no edital <strong>{edital}</strong> foi registrada.
      </Text>
      <Text style={styles.paragraph}>
        Número da inscrição: <strong>{numero}</strong>
      </Text>
      <Text style={styles.paragraph}>
        Você pode acompanhar o andamento e o status na sua área do proponente.
      </Text>
      <CtaButton href={url} label="Acompanhar inscrição" />
    </Layout>
  )
}
