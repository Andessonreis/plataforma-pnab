import { Heading, Link, Text } from '@react-email/components'
import { CtaButton } from './_shared/cta-button'
import { Layout } from './_shared/layout'
import { colors, styles } from './_shared/theme'

export interface RecuperacaoSenhaData {
  nome: string
  resetUrl: string
}

export const recuperacaoSenhaSubject = () =>
  'Recuperação de Senha — Portal PNAB Irecê'

export function RecuperacaoSenha({ nome, resetUrl }: RecuperacaoSenhaData) {
  return (
    <Layout preview="Solicitação para redefinir sua senha no Portal PNAB Irecê">
      <Heading style={styles.h1}>Recuperação de senha</Heading>
      <Text style={styles.paragraph}>
        Olá, <strong>{nome}</strong>!
      </Text>
      <Text style={styles.paragraph}>
        Recebemos uma solicitação para redefinir sua senha no Portal PNAB Irecê.
        Clique no botão abaixo para criar uma nova:
      </Text>
      <CtaButton href={resetUrl} label="Redefinir minha senha" />
      <Text style={{ ...styles.paragraph, fontSize: '14px', color: colors.textMuted }}>
        Este link é válido por <strong>1 hora</strong>. Se você não solicitou a recuperação,
        ignore este e-mail — sua senha continuará a mesma.
      </Text>
      <Text style={{ ...styles.paragraph, fontSize: '12px', color: colors.textSubtle }}>
        Se o botão não funcionar, copie e cole o link no navegador:{' '}
        <Link href={resetUrl} style={{ color: colors.primary }}>
          {resetUrl}
        </Link>
      </Text>
    </Layout>
  )
}
