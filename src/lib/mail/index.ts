import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export type EmailTemplate =
  | 'comprovante_inscricao'
  | 'resultado_preliminar'
  | 'resultado_final'
  | 'protocolo_atendimento'
  | 'notificacao_prazo'
  | 'recuperacao_senha'

export interface SendEmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, unknown>
}

// Templates são renderizados no worker; esta função é para envio direto (opcional)
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: renderTemplate(options.template, options.data),
  })
}

// Renderização básica — substituir por react-email ou mjml quando necessário
function renderTemplate(template: EmailTemplate, data: Record<string, unknown>): string {
  const templates: Record<EmailTemplate, string> = {
    comprovante_inscricao: `
      <h2>Inscrição recebida com sucesso!</h2>
      <p>Número: <strong>${data.numero}</strong></p>
      <p>Edital: <strong>${data.edital}</strong></p>
      <p>Acompanhe o status em: <a href="${data.url}">${data.url}</a></p>
    `,
    resultado_preliminar: `
      <h2>Resultado Preliminar Publicado</h2>
      <p>O resultado preliminar do edital <strong>${data.edital}</strong> foi publicado.</p>
      <p>Acesse: <a href="${data.url}">${data.url}</a></p>
    `,
    resultado_final: `
      <h2>Resultado Final Publicado</h2>
      <p>O resultado final do edital <strong>${data.edital}</strong> foi publicado.</p>
      <p>Acesse: <a href="${data.url}">${data.url}</a></p>
    `,
    protocolo_atendimento: `
      <h2>Protocolo de Atendimento</h2>
      <p>Seu protocolo: <strong>${data.protocolo}</strong></p>
      <p>Responderemos no prazo de até 5 dias úteis.</p>
    `,
    notificacao_prazo: `
      <h2>Lembrete de Prazo</h2>
      <p>${data.mensagem}</p>
      <p>Acesse: <a href="${data.url}">${data.url}</a></p>
    `,
    recuperacao_senha: `
      <h2>Recuperação de Senha</h2>
      <p>Olá, <strong>${data.nome}</strong>!</p>
      <p>Recebemos uma solicitação para redefinir sua senha no Portal PNAB Irecê.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <p>
        <a href="${data.resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
          Redefinir minha senha
        </a>
      </p>
      <p style="margin-top:16px;font-size:14px;color:#64748b;">
        Este link é válido por <strong>1 hora</strong>. Se você não solicitou a recuperação, ignore este e-mail.
      </p>
      <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
        Se o botão não funcionar, copie e cole o link: ${data.resetUrl}
      </p>
    `,
  }

  return templates[template] ?? `<p>${JSON.stringify(data)}</p>`
}
