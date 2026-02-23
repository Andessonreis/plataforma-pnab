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
  }

  return templates[template] ?? `<p>${JSON.stringify(data)}</p>`
}
